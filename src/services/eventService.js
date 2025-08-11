const Event = require('../models/Event');
const { RRule, RRuleSet, rrulestr } = require('rrule');
const moment = require('moment');


async function createEvent(req, res) {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      participants,
      recurrence
    } = req.body;

    // Validate required fields
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'title, startTime, and endTime are required' });
    }

    // Create new event
    const event = await Event.create({
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      participants: participants || [],
      recurrence: recurrence || { freq: 'none' },
      creator: req.user.userId,
      isSeriesMaster: recurrence && recurrence.freq !== 'none'
    });

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getMyEvents(req, res) {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: "Please provide 'start' and 'end' query parameters" });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // 1️⃣ Get all events where user is creator or participant
    const events = await Event.find({
      $or: [
        { creator: req.user.userId },
        { participants: req.user.userId }
      ]
    });

    let expandedEvents = [];

    // 2️⃣ Expand each event if recurring
    for (let event of events) {
      if (event.recurrence && event.recurrence.freq && event.recurrence.freq !== 'none') {
        // Build recurrence rule
        const options = {
          freq: RRule[event.recurrence.freq.toUpperCase()],
          interval: event.recurrence.interval || 1,
          dtstart: new Date(event.startTime),
          until: event.recurrence.endDate ? new Date(event.recurrence.endDate) : endDate
        };

        if (event.recurrence.byWeekday) {
          options.byweekday = event.recurrence.byWeekday.map(day => RRule[day]);
        }

        const rule = new RRule(options);

        const occurrenceDates = rule.between(startDate, endDate, true);

        for (let occ of occurrenceDates) {
          // Skip excluded dates
          if (event.exDates && event.exDates.some(ex => moment(ex).isSame(occ, 'day'))) continue;

          expandedEvents.push({
            masterId: event._id,
            title: event.title,
            description: event.description,
            startTime: occ,
            endTime: moment(occ).add(moment(event.endTime).diff(moment(event.startTime)), 'ms').toDate(),
            participants: event.participants,
            isSeriesMaster: false,
            isException: false
          });
        }
      } else {
        // Non-recurring event
        if (
          moment(event.startTime).isBetween(startDate, endDate, null, '[]') ||
          moment(event.endTime).isBetween(startDate, endDate, null, '[]')
        ) {
          expandedEvents.push({
            masterId: event._id,
            title: event.title,
            description: event.description,
            startTime: event.startTime,
            endTime: event.endTime,
            participants: event.participants,
            isSeriesMaster: event.isSeriesMaster || false,
            isException: false
          });
        }
      }
    }

    // 3️⃣ Sort by startTime
    expandedEvents.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    res.json(expandedEvents);

  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Server error fetching events" });
  }
}

async function updateEvent(req, res) {
  try {
    const { eventId } = req.params;
    const { updateScope, ...updates } = req.body; // updateScope = 'thisEvent' | 'thisAndFollowing' | 'allEvents'

    // 1️⃣ Event exists check
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // 2️⃣ Authorization check (only creator or admin)
    if (event.creator.toString() !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to update this event" });
    }

    // 3️⃣ Handle update based on scope
    if (updateScope === "thisEvent") {
      // Make this date an exception & create a new single occurrence event
      const occurrenceDate = moment(event.startTime).toDate();
      event.exDates.push(occurrenceDate);
      await event.save();

      const newEvent = new Event({
        ...event.toObject(),
        ...updates,
        _id: undefined,
        startTime: updates.startTime || event.startTime,
        endTime: updates.endTime || event.endTime,
        isSeriesMaster: false,
        isException: true,
        masterId: event._id
      });
      await newEvent.save();

      return res.json({ message: "Updated only this occurrence", updatedEvent: newEvent });
    }

    else if (updateScope === "thisAndFollowing") {
      // Split into two series
      const splitDate = updates.startTime || event.startTime;

      // Adjust current event's recurrence end date to day before split
      event.recurrence.endDate = moment(splitDate).subtract(1, "day").toDate();
      await event.save();

      // Create new master event starting from splitDate
      const newSeries = new Event({
        ...event.toObject(),
        ...updates,
        _id: undefined,
        startTime: splitDate,
        isSeriesMaster: true,
        recurrence: {
          ...event.recurrence,
          endDate: event.recurrence.endDate || null
        }
      });
      await newSeries.save();

      return res.json({ message: "Updated this and following events", updatedSeries: newSeries });
    }

    else if (updateScope === "allEvents") {
      Object.assign(event, updates);
      await event.save();

      return res.json({ message: "Updated entire series", updatedEvent: event });
    }

    else {
      return res.status(400).json({ error: "Invalid updateScope. Use 'thisEvent', 'thisAndFollowing', or 'allEvents'." });
    }

  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Server error updating event" });
  }
}

async function deleteEvent(req, res) {
  try {
    const { eventId } = req.params;
    const { mode } = req.query; // thisEvent | thisAndFollowing | allEvents

    if (!['thisEvent', 'thisAndFollowing', 'allEvents'].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode. Use 'thisEvent', 'thisAndFollowing', or 'allEvents'." });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (req.user.role !== 'admin' && event.creator.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized to delete this event" });
    }

    if (mode === 'allEvents') {
      await Event.deleteMany({ 
        $or: [
          { _id: event._id },
          { seriesId: event.seriesId }
        ]
      });
      return res.json({ message: "All events in the series deleted" });
    }

    if (mode === 'thisEvent') {
      if (event.isSeriesMaster) {
        event.exDates.push(event.startTime);
        await event.save();
        return res.json({ message: "Only this occurrence deleted" });
      } else {
        await Event.findByIdAndDelete(eventId);
        return res.json({ message: "Event deleted" });
      }
    }

    if (mode === 'thisAndFollowing') {
      if (event.isSeriesMaster) {
        event.recurrence.endDate = moment(event.startTime).subtract(1, 'day').toDate();
        await event.save();
        return res.json({ message: "This and following events deleted from series" });
      } else {
        await Event.updateOne(
          { _id: event.seriesId },
          { $set: { 'recurrence.endDate': moment(event.startTime).subtract(1, 'day').toDate() } }
        );
        return res.json({ message: "This and following events deleted" });
      }
    }

  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Server error deleting event" });
  }
}


module.exports = {
  createEvent,
  getMyEvents,
  updateEvent,
  deleteEvent,
};
