const express = require('express');
const mockAuth = require('./middleware/mockAuth');
const eventRoutes = require('./routes/events');

const app = express();
app.use(express.json());
app.use(mockAuth); // all routes require mock auth

app.use('/api', eventRoutes);

module.exports = app;
