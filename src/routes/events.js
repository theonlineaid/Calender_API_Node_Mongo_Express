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
router.get('/myevents', mockAuth, getMyEvents);
router.put('/events/:eventId', mockAuth, checkEventPermission, updateEvent);

// http://localhost:5000/api/events/689a4d72470c4b0ae6bd4843?mode=thisEvent
router.delete('/events/:eventId', mockAuth, checkEventPermission, deleteEvent);

module.exports = router;
