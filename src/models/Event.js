const mongoose = require('mongoose');

const recurrenceSchema = new mongoose.Schema({
  freq: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none'
  },
  interval: { type: Number, default: 1 }, // every X days/weeks/months
  endDate: { type: Date },                 // when recurrence stops
  byWeekday: [{ type: String }]            // e.g. ['MO', 'WE', 'FR'] for weekly
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Recurrence pattern
  recurrence: recurrenceSchema,

  // Store dates to skip for recurring events
  exDates: [{ type: Date }],

  // Series master ID for related occurrences
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },

  // Metadata
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isSeriesMaster: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
