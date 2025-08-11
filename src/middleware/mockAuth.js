// src/middleware/mockAuth.js
module.exports = (req, res, next) => {
  req.user = {
    userId: '64e76a0f1234567890abcdef',
    role: 'admin'
  };
  next();
};
