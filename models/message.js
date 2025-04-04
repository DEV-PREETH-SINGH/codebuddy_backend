// /models/Message.js

const mongoose = require('mongoose');

// Define the Message schema
const messageSchema = new mongoose.Schema({
  senderUID: {
    type: String,
    required: true, // Ensure senderUID is provided
  },
  receiverUID: {
    type: String,
    required: true, // Ensure receiverUID is provided
  },
  message: {
    type: String,
    required: true, // Ensure message is provided
  },
  timestamp: {
    type: Date,
    default: Date.now, // Automatically set the current date and time
    required: true,    // Ensure a timestamp is always present
  },
  isRead: { type: Boolean, default: false }
});

// Create the Message model from the schema
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
