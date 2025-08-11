const express = require('express');
const router = express.Router();
const {
  createEvent,
  getMyEvents,
  updateEvent,
  deleteEvent
} = require('../services/eventService');

const mockAuth = require('../middleware/mockAuth');
const checkEventPermission = require('../middleware/checkEventPermission');

router.post('/events', createEvent);
router.get('/myevents', getMyEvents);
router.put('/events/:eventId', updateEvent);
router.delete('/events/:eventId', deleteEvent);

module.exports = router;
