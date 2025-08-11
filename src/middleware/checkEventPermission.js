// src/middleware/checkEventPermission.js
const Event = require('../models/Event');

module.exports = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (req.user.role === 'admin') {
      req.event = event;
      return next();
    }
    if (event.creator.toString() === req.user.userId) {
      req.event = event;
      return next();
    }
    return res.status(403).json({ error: 'You do not have permission to modify this event' });

  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Server error checking permissions' });
  }
};
