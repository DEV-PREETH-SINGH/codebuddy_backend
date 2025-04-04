// /routes/messageRoutes.js

const express = require('express');
const Message = require('../models/message'); // Import the Message model
const router = express.Router();

// Endpoint to get messages between two users
router.get('/get-messages', async (req, res) => {
  const { user1, user2 } = req.query;

  try {
    const messages = await Message.find({
      $or: [
        { senderUID: user1, receiverUID: user2 },
        { senderUID: user2, receiverUID: user1 },
      ],
    }).sort({ timestamp: 1 }); // Sort by timestamp (oldest first)

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Endpoint to send a new message
router.post('/send-message', async (req, res) => {
  const { senderUID, receiverUID, message } = req.body;

  try {
    const newMessage = new Message({
      senderUID,
      receiverUID,
      message,
    });

    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
