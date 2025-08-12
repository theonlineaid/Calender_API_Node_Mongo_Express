# Calendar API with Recurrence Support

A RESTful API built with **Node.js**, **Express.js**, and **MongoDB** that allows users to create, update, delete, and fetch calendar events with full recurrence support (daily, weekly, monthly).

---

## Features

* **Event Creation** with title, description, start/end time, participants, and recurrence options.
* **Event Update** supporting:

  * Update a single event instance (`thisEvent`).
  * Update this and all following events (`thisAndFollowing`).
  * Update all events in the series (`allEvents`).
* **Event Deletion** supporting the same recurrence modes.
* **Mock Authentication** middleware simulating users and roles (`user` and `admin`).
* **Authorization**: Only event creators or admins can update/delete events.
* **Get Events** endpoint that returns all your events expanded by recurrence rules.
* Structured, consistent JSON responses.
* Recurrence rules handled with [`rrule`](https://github.com/jakubroztocil/rrule).

---

## Tech Stack

* Backend: Node.js, Express.js
* Database: MongoDB with Mongoose ODM
* Recurrence Handling: `rrule` library
* Date Handling: `moment.js`
* Mock Authentication & Role Based Access Control

---

## API Endpoints

| Method | Endpoint                     | Description                         | Authentication | Notes                                                                    |
| ------ | ---------------------------- | ----------------------------------- | -------------- | ------------------------------------------------------------------------ |
| POST   | `/api/events`                | Create a new event                  | Required       | Supports recurrence config                                               |
| GET    | `/api/myevents?start=&end=`  | Get all your events in a date range | Required       | Returns expanded events according to recurrence                          |
| PUT    | `/api/events/:eventId`       | Update event(s)                     | Required       | `updateScope` query param (`thisEvent`, `thisAndFollowing`, `allEvents`) |
| DELETE | `/api/events/:eventId?mode=` | Delete event(s)                     | Required       | `mode` query param same options as update                                |

---

## Usage

### Authentication

* Mock authentication middleware assigns a static `userId` and `role`.
* Only event creators or admins can update/delete events.

### Creating an Event

Request body example:

```json
{
  "title": "Team Standup",
  "description": "Daily sync meeting",
  "startTime": "2025-08-10T09:00:00.000Z",
  "endTime": "2025-08-10T09:30:00.000Z",
  "participants": ["66b1fae2a8b9c4dca06d53f2"],
  "recurrence": {
    "freq": "daily",
    "interval": 1,
    "endDate": "2025-08-30T23:59:59.000Z",
    "byWeekday": []
  }
}
```

---

### Updating an Event

Send a `PUT` request to `/api/events/:eventId` with body like:

```json
{
  "updateScope": "thisEvent",
  "title": "Updated Standup Meeting",
  "startTime": "2025-08-10T10:00:00.000Z",
  "endTime": "2025-08-10T10:30:00.000Z"
}
```

* `updateScope` controls the update type:

  * `thisEvent`: update only this occurrence.
  * `thisAndFollowing`: update this and future occurrences.
  * `allEvents`: update the whole series.

---

### Deleting an Event

`DELETE /api/events/:eventId?mode=thisEvent`

* `mode` query param options:

  * `thisEvent` — delete only this instance.
  * `thisAndFollowing` — delete this and future events.
  * `allEvents` — delete entire series.

---

## Getting Events

Get all your events in a date range, expanded by recurrence:

```
GET /api/myevents?start=2025-08-01T00:00:00.000Z&end=2025-08-31T23:59:59.000Z
```

---

## Installation & Setup

1. Clone this repository:

```bash
git clone https://github.com/yourusername/calendar-api.git
cd calendar-api
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file with MongoDB connection string:

```
MONGODB_URI=mongodb://localhost:27017/calendar_db
PORT=5000
```

4. Start the server:

```bash
node src/server.js
```

5. API will run on `http://localhost:5000/api/`

---

## Folder Structure

```
calendar-api/
│
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB Atlas connection
│   │
│   ├── middleware/
│   │   └── mockAuth.js           # Mock authentication
│   │
│   ├── models/
│   │   ├── Event.js               # Event schema with recurrence
│   │   └── User.js                # Mock user schema (optional)
│   │
│   ├── routes/
│   │   └── events.js              # All event CRUD routes
│   │
│   ├── services/
│   │   ├── eventService.js        # Business logic for events (recurrence, updates)
│   │   └── recurrence.js          # rrule-based recurrence helpers
│   │
│   ├── utils/
│   │   └── validateObjectId.js    # Helper to check MongoDB ObjectId validity
│   │
│   ├── app.js                     # Express app setup, middleware
│   └── server.js                  # Entry point to start server
│
├── .env                           # Environment variables (Atlas URI, PORT)
├── .gitignore
├── package.json
├── README.md
└── postman_collection.json        # Postman API documentation
```

---

## Technologies Used

* [Express.js](https://expressjs.com/)
* [Mongoose](https://mongoosejs.com/)
* [RRule](https://github.com/jakubroztocil/rrule)
* [Moment.js](https://momentjs.com/)
* [Node.js](https://nodejs.org/en/)

---

## Postman Collection

A Postman collection is included in the repo to test the APIs easily.
or, Check this link
* [Collection](https://documenter.getpostman.com/view/41561527/2sB3BEoqWY)


## 🗄️ Database Schemas

### **User Schema**

```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

**Explanation**

* `name` → User's display name.
* `email` → Unique and validated email address.
* `role` → Used for permission control (`user` or `admin`).
* Automatic `createdAt` and `updatedAt` fields with `timestamps`.

---

### **Event Schema**

```js
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

  recurrence: recurrenceSchema,  // Recurrence pattern
  exDates: [{ type: Date }],     // Exception dates to skip
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, // Master event ID for series

  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isSeriesMaster: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
```

**Explanation**

* `title` / `description` → Event details.
* `startTime` / `endTime` → Event timing.
* `participants` → Array of user IDs.
* `recurrence` → Nested object defining repeat pattern.
* `exDates` → Dates to skip in recurrence.
* `seriesId` → Used to link recurring events together.
* `creator` → User who created the event.
* `isSeriesMaster` → Marks the first/main event in a series.
---