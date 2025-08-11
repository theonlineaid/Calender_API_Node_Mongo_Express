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