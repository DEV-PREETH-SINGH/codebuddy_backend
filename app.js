const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();
const router = express.Router();
const moment = require('moment');
const app = express();
const http = require('http');
const server = http.createServer(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all routes
app.use(limiter);

// Use compression
app.use(compression());

// Middleware
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads')); // Serve images from 'uploads' folder
app.use(cors());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Import models
const User = require('./models/User');
const Message = require('./models/message');
const Problem = require("./models/striver79DsaSheetProblems");

const baseUrl = process.env.BASE_URL || 'http://192.168.68.67:5000'; // Default to localhost for development
console.log(baseUrl);

// Socket.io setup with CORS
const io = require("socket.io")(server, {
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Map to store user ID to socket ID connections
const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  io.emit("user connected", { message: "A new user has joined" });
  
  // Handle user connection with their UID
  socket.on('userConnected', (data) => {
    if (data.userId) {
      console.log(`User ${data.userId} connected with socket ${socket.id}`);
      userSocketMap[data.userId] = socket.id;
      socket.join(data.userId); // Join a room with user's ID
    }
  });

  // socket.on("sendMessage", async ({ senderUID, receiverUID, message }) => {
  //   try {
  //     // Create new message
  //     const newMessage = new Message({ 
  //       senderUID, 
  //       receiverUID, 
  //       message,
  //       isRead: false,
  //       timestamp: new Date()
  //     });
      
  //     await newMessage.save();
      
  //     // Emit to the receiver's room
  //     io.emit("newMessage", { 
  //       senderId: senderUID,
  //       receiverId: receiverUID,
  //       message: message,
  //       messageId: newMessage._id
  //     });
      
  //     console.log(`Message sent from ${senderUID} to ${receiverUID}`);
  //   } catch (error) {
  //     console.error("Error saving message:", error);
  //   }
  // });

   // Handle joining a specific chat
   socket.on('joinChat', ({ user1, user2 }) => {
    // Create a unique room for this chat pair
    const chatRoom = [user1, user2].sort().join('_');
    socket.join(chatRoom);
    console.log(`User joined chat room: ${chatRoom}`);
  });

  // Handle sending a message
  socket.on('sendMessage', async ({ senderUID, receiverUID, message }, callback) => {
    try {
      // Create new message
      const newMessage = new Message({ 
        senderUID, 
        receiverUID, 
        message,
        isRead: false,
        timestamp: new Date()
      });
      
      await newMessage.save();
      
      // Create a unique chat room
      const chatRoom = [senderUID, receiverUID].sort().join('_');
      
      // Emit to the specific chat room
      io.to(chatRoom).emit("newMessage", newMessage);
      
      // Acknowledge successful message send
      callback({ success: true, message: newMessage });
      
      console.log(`Message sent from ${senderUID} to ${receiverUID}`);
    } catch (error) {
      console.error("Error saving message:", error);
      callback({ success: false, error: error.message });
    }
  });
  
  // Handle marking messages as read
  socket.on('markAsRead', async ({ userId, chatPartnerId }) => {
    try {
      await Message.updateMany(
        { senderUId: chatPartnerId, receiverUId: userId, isRead: false },
        { $set: { isRead: true } }
      );
      
      console.log(`Marked messages as read from ${chatPartnerId} to ${userId}`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });

  socket.on("disconnect", () => {
    // Remove user from socket map
    const userId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
    if (userId) {
      delete userSocketMap[userId];
      console.log(`User ${userId} disconnected`);
    }
    console.log("User disconnected:", socket.id);
  });
});

// Get unread messages
app.get("/get-unread-messages", async (req, res) => {
  try {
    const { uid } = req.query;
    
    // Make sure field names match your model schema (receiverUId vs receiverId)
    const unreadMessages = await Message.aggregate([
      { $match: { receiverUID: uid, isRead: false } },
      { $group: { _id: "$senderUID", count: { $sum: 1 } } },
    ]);
    
    const unreadStatus = {};
    unreadMessages.forEach((msg) => {
      unreadStatus[msg._id] = true; // Mark sender as having unread messages
    });
    
    res.json(unreadStatus);
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    res.status(500).json({ error: "Server error" });
  }
});

//---claude code
// Add this route to your existing backend code
app.post('/api/messages/mark-as-read', async (req, res) => {
  const { userId, chatPartnerId } = req.body;

  if (!userId || !chatPartnerId) {
    return res.status(400).json({ error: 'User ID and Chat Partner ID are required' });
  }

  try {
    // Update messages to mark as read
    const result = await Message.updateMany(
      { 
        senderUID: chatPartnerId, 
        receiverUID: userId, 
        isRead: false 
      },
      { $set: { isRead: true } }
    );

    res.status(200).json({ 
      message: 'Messages marked as read', 
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.use('/uploads', express.static('uploads')); // Serve images from 'uploads' folder

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: './uploads/', // Save uploaded files in 'uploads' folder
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));


// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).send({ message: 'Server is running' });
});

// Signup Endpoint: Save user info to MongoDB after Firebase Authentication
app.post('/signup', async (req, res) => {
  const { email, uid } = req.body;

  if (!email || !uid) {
    return res.status(400).send({ message: 'Missing required fields' });
  }

  try {
    console.log("1")
    const existingUser = await User.findOne({ uid });
    if (existingUser) {
      return res.status(400).send({ message: 'User already exists' });
    }

    const newUser = new User({
      username:"",
      email,
      uid,
      clickedStartToday: false, // Initialize as false
      dateJoined: null,         // No timestamp until "Start Today" is clicked
      preferredLanguage:"",
      preferredSolvingTime:"",
    });
    await newUser.save();
    res.status(201).send({ message: 'User registered successfully', user: newUser });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).send({ message: 'Error registering user', error: err.message });
  }
});

// API Endpoint to fetch user by UID
app.get('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    console.log("from backend ",uid);
    // Find user by UID
    const user = await User.findOne({ uid });

    console.log("from backend ",user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the username and profilePic
    res.json({
      username: user.username,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// "Start Today" Endpoint: Update user status
app.post('/start-today', async (req, res) => {
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).send({ message: 'Missing UID' });
  }

  try {
    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Update `clickedStartToday` and `dateJoined`
    user.clickedStartToday = true;
    user.dateJoined = new Date(); // Current timestamp
    await user.save();

    res.status(200).send({ message: 'Start Today status updated successfully', user });
  } catch (err) {
    console.error('Error updating Start Today status:', err);
    res.status(500).send({ message: 'Error updating Start Today status', error: err.message });
  }
});

app.get('/count-start-today', async (req, res) => {
  try {
    // Get the start and end of today
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();

    // Count users who clicked the "start" button today
    const count = await User.countDocuments({
      clickedStartToday: true,  // Ensure the "start" button was clicked
      dateJoined: { $gte: todayStart, $lt: todayEnd },  // Filter users who joined today
    });

    console.log(count)

    res.status(200).send({ count });  // Send the count as a response
  } catch (err) {
    console.error('Error fetching start today count:', err);
    res.status(500).send({ message: 'Error fetching start today count', error: err.message });
  }
});


// Get users who clicked "Start Today" on the current day, excluding the current user
// server.js (Backend)
app.get('/get-users', async (req, res) => {
  const { uid } = req.query; // Get UID from query params
  
  if (!uid) {
    return res.status(400).send({ message: 'Missing UID in request' });
  }
  
  try {
    // Get the current user's profile preferences
    const currentUser = await User.findOne({ uid });
    if (!currentUser) {
      return res.status(404).send({ message: 'User not found' });
    }
    
    // Get the current date range (start and end of the day)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    // Fetch users with matching preferences on all criteria
    const users = await User.find(
      {
        clickedStartToday: true,
        dateJoined: { $gte: startOfDay, $lte: endOfDay },
        preferredLanguage: currentUser.preferredLanguage,
        preferredSolvingTime: currentUser.preferredSolvingTime,
        dsaSheet: currentUser.dsaSheet,           // Added dsaSheet matching
        dailyProblems: currentUser.dailyProblems, // Added dailyProblems matching
        uid: { $ne: uid }, // Exclude current user's UID
      },
      'uid username profilePic preferredLanguage preferredSolvingTime dsaSheet dailyProblems codingGoal codingLevel codingSpeed solvePreference partnerPreference bio' // Include all metadata fields
    );
        
    res.status(200).send({ message: 'Users fetched successfully', users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send({ message: 'Error fetching users', error: err.message });
  }
});
// Route to fetch user data by UID
app.get('/api/users/get-username', async (req, res) => {
  const { userUID } = req.query;

  if (!userUID) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  try {
    // Find user by UID
    const user = await User.findOne({ uid: userUID });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log("hi");
    console.log(user.username);
    // Send user data as response
    res.status(200).json({ username: user.username });
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================
// Messaging Endpoints
// =====================

app.get('/api/messages/get-messages', async (req, res) => {
  const { user1, user2 } = req.query;

  if (!user1 || !user2) {
    return res.status(400).json({ message: 'Missing user1 or user2 in request' });
  }

  try {
    const messages = await Message.find({
      $or: [
        { senderUID: user1, receiverUID: user2 },
        { senderUID: user2, receiverUID: user1 },
      ],
    }).sort({ timestamp: 1 }); // Sort by timestamp (oldest first)

    res.status(200).json({ messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Error fetching messages', error: err.message });
  }
});

// WebSocket connection event
// io.on('connection', (socket) => {
//   console.log('A user connected', socket.id);

//   socket.on('sendMessage', async (messageData) => {
//     console.log('Message received:', messageData);

//     try {
//       const { senderUID, receiverUID, message } = messageData;

//       const newMessage = new Message({
//         senderUID,
//         receiverUID,
//         message,
//         timestamp: new Date(),
//       });

//       const savedMessage = await newMessage.save();

//       // Emit only to sender and receiver instead of broadcasting
//       socket.to(receiverUID).emit('newMessage', savedMessage);
//       socket.emit('messageSent', savedMessage);
//     } catch (err) {
//       console.error('Error handling sendMessage:', err);
//       socket.emit('error', { message: 'Error sending message', error: err.message });
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected', socket.id);
//   });
// });

// Endpoint to send a new message
app.post('/api/messages/send-message', async (req, res) => {
  const { senderUID, receiverUID, message } = req.body;

  if (!senderUID || !receiverUID || !message) {
    return res.status(400).json({ message: 'Missing required fields: senderUID, receiverUID, or message' });
  }

  try {
    const newMessage = new Message({
      senderUID,
      receiverUID,
      message,
      timestamp: new Date(),
    });

    const savedMessage = await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully', savedMessage });

    // Emit the message to both sender and receiver
    const chatRoom = [senderUID, receiverUID].sort().join('_');
    io.to(chatRoom).emit('newMessage', savedMessage);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Error sending message', error: err.message });
  }
});

// Route 1: /send-special - Push currentUserUID to the other user's pendingRequest
// Import Message model (assuming you have it)
// const Message = require('../models/Message'); // Adjust the path according to your project structure

app.post('/api/messages/send-special', async (req, res) => {
  const { senderUID, receiverUID, message } = req.body;
  
  try {
    // Find the receiver and add the sender's UID to the pendingRequest array
    const receiver = await User.findOne({ uid: receiverUID });
    
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }
    
    // Add sender's UID to receiver's pendingRequest
    receiver.pendingRequest.push(senderUID);
    await receiver.save();
    
    // Also save this as a regular message
    const newMessage = new Message({
      senderUID,
      receiverUID,
      message, // This will be "./send"
      timestamp: new Date().toISOString()
    });
    
    await newMessage.save();
    
    res.status(201).json({ 
      message: 'Request sent successfully',
      messageId: newMessage._id 
    });
  } catch (error) {
    console.error('Error sending special request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to set a new partner and clear old partner relationship
app.post('/api/set-partner', async (req, res) => {
  const { userId, newPartnerId } = req.body;
  
  if (!userId || !newPartnerId) {
    return res.status(400).json({ error: 'Both user ID and new partner ID are required' });
  }
  
  try {
    // Find the current user and the new partner
    const currentUser = await User.findOne({ uid: userId });
    const newPartner = await User.findOne({ uid: newPartnerId });
    
    if (!currentUser || !newPartner) {
      return res.status(404).json({ error: 'One or both users not found' });
    }
    
    // Check if the current user already has a partner
    if (currentUser.partner) {
      const oldPartner = await User.findOne({ uid: currentUser.partner });
      
      // If old partner exists and has the current user as their partner, clear it
      if (oldPartner && oldPartner.partner === userId) {
        oldPartner.partner = null;
        await oldPartner.save();
      }
    }
    
    // Check if the new partner already has a partner
    if (newPartner.partner) {
      const newPartnerOldPartner = await User.findOne({ uid: newPartner.partner });
      
      // If new partner's old partner exists and has the new partner as their partner, clear it
      if (newPartnerOldPartner && newPartnerOldPartner.partner === newPartnerId) {
        newPartnerOldPartner.partner = null;
        await newPartnerOldPartner.save();
      }
    }
    
    // Update the partnership for both users
    currentUser.partner = newPartnerId;
    newPartner.partner = userId;
    
    // Save both users
    await currentUser.save();
    await newPartner.save();
    
    res.status(200).json({
      message: 'Partner relationship updated successfully',
      currentUser: {
        uid: currentUser.uid,
        partner: currentUser.partner
      },
      newPartner: {
        uid: newPartner.uid,
        partner: newPartner.partner
      }
    });
    
  } catch (error) {
    console.error('Error updating partner relationship:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update the existing partner acceptance endpoint to use the new functionality
app.post('/api/messages/accepted', async (req, res) => {
  const { senderUID, receiverUID, message } = req.body;
  
  try {
    // Find the current user (sender) and the receiver
    const sender = await User.findOne({ uid: senderUID });
    const receiver = await User.findOne({ uid: receiverUID });
    
    if (!sender || !receiver) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if the receiver's UID is in the sender's pendingRequest
    if (!sender.pendingRequest.includes(receiverUID)) {
      return res.status(400).json({ error: 'No pending request from the receiver' });
    }
    
    // Handle old partnerships before creating new ones
    
    // Check if the sender already has a partner
    if (sender.partner) {
      const oldPartner = await User.findOne({ uid: sender.partner });
      
      // If old partner exists and has the sender as their partner, clear it
      if (oldPartner && oldPartner.partner === senderUID) {
        oldPartner.partner = null;
        await oldPartner.save();
      }
    }
    
    // Check if the receiver already has a partner
    if (receiver.partner) {
      const oldPartner = await User.findOne({ uid: receiver.partner });
      
      // If old partner exists and has the receiver as their partner, clear it
      if (oldPartner && oldPartner.partner === receiverUID) {
        oldPartner.partner = null;
        await oldPartner.save();
      }
    }
    
    // Update the partner field for both users
    sender.partner = receiverUID;
    receiver.partner = senderUID;
    
    // Remove receiverUID from sender's pendingRequest
    sender.pendingRequest.pull(receiverUID);
    
    // Save the updated users
    await sender.save();
    await receiver.save();
    
    // Also save this as a regular message
    const newMessage = new Message({
      senderUID,
      receiverUID,
      message, // This will be "./accepted"
      timestamp: new Date().toISOString()
    });
    
    await newMessage.save();
    
    res.status(201).json({ 
      message: 'Partner request accepted successfully and pending request removed',
      messageId: newMessage._id 
    });
  } catch (error) {
    console.error('Error accepting partner request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//-------------chatscreen end

// Route to get distinct chat users
app.get('/get-chat-users', async (req, res) => {
  const { uid } = req.query; // Current user UID from the frontend

  if (!uid) {
    return res.status(400).send('User UID is required');
  }

  try {
    const chatUsers = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderUID: uid },
            { receiverUID: uid }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$senderUID", uid] },
              then: "$receiverUID",
              else: "$senderUID"
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users', // Assuming the user collection is called 'users'
          localField: '_id',
          foreignField: 'uid', // Assuming the field in the users collection that holds the user ID is 'uid'
          as: 'userDetails'
        }
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true // This will preserve users even if they don't have a corresponding entry in the 'users' collection
        }
      },
      {
        $project: {
          _id: 1,
          username: "$userDetails.username", // Project the username
          profilePic: "$userDetails.profilePic" // Project the profilePic URL or path
        }
      }
    ]);

    if (chatUsers.length === 0) {
      return res.status(200).json([]); // Return an empty array if no chat users
    }

    res.json(chatUsers); // Send the list of users with usernames and profile pics to the frontend
  } catch (error) {
    console.error('Error fetching chat users:', error);
    res.status(500).send('Server error');
  }
});
//-----------------get chat user end
app.get('/get-partner', async (req, res) => {
  const currentUID = req.query.uid; // Get the current user's UID from the query parameter

  if (!currentUID) {
    return res.status(400).json({ message: 'Current UID is required' });
  }

  try {
    // Find the user by their UID in the database
    const user = await User.findOne({ uid: currentUID });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user has a partner
    if (user.partner) {
      console.log("my partner uid:", user.partner)
      return res.json({ partnerUID: user.partner }); // Return the partner UID
    } else {
      return res.json({ partnerUID: null }); // If no partner exists
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});
// API to check submissions and update streaks
app.post('/api/messages/check-streak', async (req, res) => {
  const { userAUID } = req.body;

  try {
    // Fetch user data from the database
    const userA = await User.findOne({ uid: userAUID });

    if (!userA) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Step 1: Check if streak is already updated today
    const today = moment().startOf('day');
    const lastStreakUpdate = moment(userA.lastStreakUpdate);

    console.log(today)
    console.log(lastStreakUpdate)


    if (lastStreakUpdate.isSame(today, 'day')) {
      console.log("came inside")
      return res.status(200).json({ 
        streakCount: userA.streakCount,
        alreadyUpdatedToday: true
      });
    }
    console.log("nope again")
    // Step 2: Verify partner exists
    if (!userA.partner) {
      return res.status(400).json({ error: 'No partner assigned' });
    }

    // Fetch partner details
    const userB = await User.findOne({ uid: userA.partner });

    if (!userB) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Step 3: Fetch LeetCode submissions
    const fetchSubmissions = async (leetcodeProfileId) => {
      try {
        const response = await axios.get(`https://leetcode-api-faisalshohag.vercel.app/${leetcodeProfileId}?timestamp=${Date.now()}`);
        return response.data.recentSubmissions || [];
      } catch (err) {
        console.error('Error fetching submissions:', err);
        return [];
      }
    };

    const submissionsA = await fetchSubmissions(userA.leetcodeProfileId);
    const submissionsB = await fetchSubmissions(userB.leetcodeProfileId);

    // Step 4: Check for accepted solutions today
    const isSameDay = (timestamp) => moment.unix(timestamp).isSame(moment(), 'day');

    const acceptedA = submissionsA.find(submission =>
      isSameDay(submission.timestamp) && submission.statusDisplay === 'Accepted'
    );

    const acceptedB = submissionsB.find(submission =>
      isSameDay(submission.timestamp) && submission.statusDisplay === 'Accepted'
    );

    // Step 5: Update streak if both solved and not updated today
    if (acceptedA && acceptedB) {
      userA.streakCount = (userA.streakCount || 0) + 1;
      userB.streakCount = (userB.streakCount || 0) + 1;
      
      userA.lastStreakUpdate = new Date();
      userB.lastStreakUpdate = new Date();

      await userA.save();
      await userB.save();

      return res.status(200).json({ 
        streakCount: userA.streakCount,
        alreadyUpdatedToday: false
      });
    }

    // If no solutions or conditions not met
    return res.status(200).json({ 
      streakCount: userA.streakCount,
      alreadyUpdatedToday: false
    });

  } catch (error) {
    console.error('Error checking streak:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//------------streakcountend

// app.get('/get-progress/:userId', async (req, res) => {
//   const userId = req.params.userId;

//   try {
//     // Find the user by their userId
//     const user = await User.findOne({ uid: userId });

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     if (!user.leetcodeProfileId) {
//       return res.status(400).json({ message: 'LeetCode username not linked' });
//     }

//     // Fetch user stats from LeetCode API
//     const response = await axios.get(`https://leetcode-api-faisalshohag.vercel.app/${user.leetcodeProfileId}`);

//     if (response.data.status !== 'success') {
//       return res.status(500).json({ message: 'Failed to fetch LeetCode stats' });
//     }

//     const { totalSolved } = response.data;

//     // Update the user's solved questions count
//     user.solvedQuestions = totalSolved;
//     user.leetcodeLastUpdated = new Date();
//     await user.save();

//     // Send the updated progress back to the frontend
//     res.json({
//       solvedQuestions: totalSolved,
//       leetcodeLastUpdated: user.leetcodeLastUpdated,
//     });
//   } catch (error) {
//     console.error('Error fetching LeetCode progress:', error.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

//this is old which was working tile 2/80 problems solved.percentage:2
// const striverDSAProblems = [
//   { id: 1, title: 'Next-Permutation', solved: false },
//   { id: 2, title: '3Sum', solved: false },
//   { id: 3, title: 'Maximum Subarray', solved: false },
//   { id: 4, title: 'Majority Element II', solved: false },
//   { id: 5, title: 'Subarrays with K Different Integers', solved: false },
//   { id: 6, title: 'Find the Duplicate Number', solved: false },
//   { id: 7, title: 'Maximum Product Subarray', solved: false },
//   { id: 8, title: 'Find the Missing Number', solved: false },
//   { id: 9, title: 'Search in Rotated Sorted Array II', solved: false },
//   { id: 10, title: 'Find Minimum in Rotated Sorted Array', solved: false },
//   { id: 11, title: 'Find Peak Element', solved: false },
//   { id: 12, title: 'Koko Eating Bananas', solved: false },
//   { id: 13, title: 'Aggressive Cows', solved: false },
//   { id: 14, title: 'Book Allocation', solved: false },
//   { id: 15, title: 'Median of Two Sorted Arrays', solved: false },
//   { id: 16, title: 'Minimize Max Distance to Gas Station', solved: false },
//   { id: 17, title: 'Middle of the Linked List', solved: false },
//   { id: 18, title: 'Detect a Loop in LL', solved: false },
//   { id: 19, title: 'Remove Nth Node From End of List', solved: false },
//   { id: 20, title: 'Intersection of Two Linked Lists', solved: false },
//   { id: 21, title: 'Sort List', solved: false },
//   { id: 22, title: 'Odd Even Linked List', solved: false },
//   { id: 23, title: 'Subsets', solved: false },
//   { id: 24, title: 'Combination Sum', solved: false },
//   { id: 25, title: 'N-Queens', solved: false },
//   { id: 26, title: 'Sudoku Solver', solved: false },
//   { id: 27, title: 'M Coloring Problem', solved: false },
//   { id: 28, title: 'Word Search', solved: false },
//   { id: 29, title: 'Next Greater Element I', solved: false },
//   { id: 30, title: 'Trapping Rain Water', solved: false },
//   { id: 31, title: 'Largest Rectangle in Histogram', solved: false },
//   { id: 32, title: 'Asteroid Collision', solved: false },
//   { id: 33, title: 'Sliding Window Maximum', solved: false },
//   { id: 34, title: 'LRU Cache', solved: false },
//   { id: 35, title: 'Kth Largest Element in an Array', solved: false },
//   { id: 36, title: 'Task Scheduler', solved: false },
//   { id: 37, title: 'Min Heap', solved: false },
//   { id: 38, title: 'Max Heap', solved: false },
//   { id: 39, title: 'Diameter of Binary Tree', solved: false },
//   { id: 40, title: 'Binary Tree Maximum Path Sum', solved: false },
//   { id: 41, title: 'Binary Tree Bottom View', solved: false },
//   { id: 42, title: 'Lowest Common Ancestor of a Binary Tree', solved: false },
//   { id: 43, title: 'Minimum Time to Burn the Binary Tree', solved: false },
//   { id: 44, title: 'Construct Binary Tree from Preorder and Inorder Traversal', solved: false },
//   { id: 45, title: 'Binary Tree Preorder Traversal', solved: false },
//   { id: 46, title: 'Delete Node in a BST', solved: false },
//   { id: 47, title: 'Lowest Common Ancestor of a Binary Search Tree', solved: false },
//   { id: 48, title: 'Two Sum IV - Input is a BST', solved: false },
//   { id: 49, title: 'Largest BST Subtree', solved: false },
//   { id: 50, title: 'Rotting Oranges', solved: false },
//   { id: 51, title: 'Word Ladder', solved: false },
//   { id: 52, title: 'Number of Distinct Islands', solved: false },
//   { id: 53, title: 'Course Schedule II', solved: false },
//   { id: 54, title: 'Alien Dictionary', solved: false },
//   { id: 55, title: 'Dijkstra\'s Algorithm', solved: false },
//   { id: 56, title: 'Cheapest Flights Within K Stops', solved: false },
//   { id: 57, title: 'Bellman-Ford Algorithm', solved: false },
//   { id: 58, title: 'Floyd-Warshall Algorithm', solved: false },
//   { id: 59, title: 'Kruskal\'s Algorithm', solved: false },
//   { id: 60, title: 'Accounts Merge', solved: false },
//   { id: 61, title: 'Bridges in Graph', solved: false },
//   { id: 62, title: 'House Robber', solved: false },
//   { id: 63, title: 'Fibonacci Number', solved: false },
//   { id: 64, title: 'Minimum Path Sum', solved: false },
//   { id: 65, title: 'Subset Sum Problem', solved: false },
//   { id: 66, title: 'Assign Cookies', solved: false },
//   { id: 67, title: 'Rod Cutting', solved: false },
//   { id: 68, title: 'Longest Common Subsequence', solved: false },
//   { id: 69, title: 'Longest Palindromic Subsequence', solved: false },
//   { id: 70, title: 'Edit Distance', solved: false },
//   { id: 71, title: 'Best Time to Buy and Sell Stock IV', solved: false },
//   { id: 72, title: 'Longest Increasing Subsequence', solved: false },
//   { id: 73, title: 'Burst Balloons', solved: false },
//   { id: 74, title: 'Implement Trie (Prefix Tree)', solved: false },
//   { id: 75, title: 'Maximum XOR of Two Numbers in an Array', solved: false },
//   { id: 76, title: 'Distinct Subsequences', solved: false },
//   { id: 77, title: 'Minimum Number of Bracket Reversals', solved: false },
//   { id: 78, title: 'Rabin Karp Algorithm', solved: false },
//   { id: 79, title: 'Z-Algorithm', solved: false },
//   { id: 80, title: 'KMP Algorithm', solved: false }
// ];

//new for difficulty

// const striverDSAProblems = [
//   { id: 1, title: 'Next-Permutation', solved: false, difficulty: 'Medium' },
//   { id: 2, title: '3Sum', solved: false, difficulty: 'Medium' },
//   { id: 3, title: 'Maximum Subarray', solved: false, difficulty: 'Medium' },
//   { id: 4, title: 'Majority Element II', solved: false, difficulty: 'Medium' },
//   { id: 5, title: 'Subarrays with K Different Integers', solved: false, difficulty: 'Hard' },
//   { id: 6, title: 'Find the Duplicate Number', solved: false, difficulty: 'Medium' },
//   { id: 7, title: 'Maximum Product Subarray', solved: false, difficulty: 'Medium' },
//   { id: 8, title: 'Find the Missing Number', solved: false, difficulty: 'Easy' },
//   { id: 9, title: 'Search in Rotated Sorted Array II', solved: false, difficulty: 'Medium' },
//   { id: 10, title: 'Find Minimum in Rotated Sorted Array', solved: false, difficulty: 'Medium' },
//   { id: 11, title: 'Find Peak Element', solved: false, difficulty: 'Medium' },
//   { id: 12, title: 'Koko Eating Bananas', solved: false, difficulty: 'Medium' },
//   { id: 13, title: 'Aggressive Cows', solved: false, difficulty: 'Not Available on LeetCode' },
//   { id: 14, title: 'Book Allocation', solved: false, difficulty: 'Not Available on LeetCode' },
//   { id: 15, title: 'Median of Two Sorted Arrays', solved: false, difficulty: 'Hard' },
//   { id: 16, title: 'Minimize Max Distance to Gas Station', solved: false, difficulty: 'Hard' },
//   { id: 17, title: 'Middle of the Linked List', solved: false, difficulty: 'Easy' },
//   { id: 18, title: 'Detect a Loop in LL', solved: false, difficulty: 'Not Available on LeetCode' },
//   { id: 19, title: 'Remove Nth Node From End of List', solved: false, difficulty: 'Medium' },
//   { id: 20, title: 'Intersection of Two Linked Lists', solved: false, difficulty: 'Easy' },
//   { id: 21, title: 'Sort List', solved: false, difficulty: 'Medium' },
//   { id: 22, title: 'Odd Even Linked List', solved: false, difficulty: 'Medium' },
//   { id: 23, title: 'Subsets', solved: false, difficulty: 'Medium' },
//   { id: 24, title: 'Combination Sum', solved: false, difficulty: 'Medium' },
//   { id: 25, title: 'N-Queens', solved: false, difficulty: 'Hard' },
//   { id: 26, title: 'Sudoku Solver', solved: false, difficulty: 'Hard' },
//   { id: 27, title: 'M Coloring Problem', solved: false, difficulty: 'Not Available on LeetCode' },
//   { id: 28, title: 'Word Search', solved: false, difficulty: 'Medium' },
//   { id: 29, title: 'Next Greater Element I', solved: false, difficulty: 'Easy' },
//   { id: 30, title: 'Trapping Rain Water', solved: false, difficulty: 'Hard' },
//   { id: 31, title: 'Largest Rectangle in Histogram', solved: false, difficulty: 'Hard' },
//   { id: 32, title: 'Asteroid Collision', solved: false, difficulty: 'Medium' },
//   { id: 33, title: 'Sliding Window Maximum', solved: false, difficulty: 'Hard' },
//   { id: 34, title: 'LRU Cache', solved: false, difficulty: 'Medium' },
//   { id: 35, title: 'Kth Largest Element in an Array', solved: false, difficulty: 'Medium' },
//   { id: 36, title: 'Task Scheduler', solved: false, difficulty: 'Medium' },
//   { id: 37, title: 'Min Heap', solved: false, difficulty: 'Not Available on LeetCode' },
//   { id: 38, title: 'Max Heap', solved: false, difficulty: 'Not Available on LeetCode' },
//   { id: 39, title: 'Diameter of Binary Tree', solved: false, difficulty: 'Easy' },
//   { id: 40, title: 'Binary Tree Maximum Path Sum', solved: false, difficulty: 'Hard' },
//   { id: 41, title: 'Binary Tree Bottom View', solved: false, difficulty: 'Not Available on LeetCode' },
//   { id: 42, title: 'Lowest Common Ancestor of a Binary Tree', solved: false, difficulty: 'Medium' },
//   { id: 43, title: 'Minimum Time to Burn the Binary Tree', solved: false, difficulty: 'Not Available on LeetCode' },
//   { id: 44, title: 'Construct Binary Tree from Preorder and Inorder Traversal', solved: false, difficulty: 'Medium' },
//   { id: 45, title: 'Binary Tree Preorder Traversal', solved: false, difficulty: 'Easy' },
//   { id: 46, title: 'Delete Node in a BST', solved: false, difficulty: 'Medium' },
//   { id: 47, title: 'Lowest Common Ancestor of a Binary Search Tree', solved: false, difficulty: 'Medium' },
//   { id: 48, title: 'Two Sum IV - Input is a BST', solved: false, difficulty: 'Easy' },
//   { id: 49, title: 'Largest BST Subtree', solved: false, difficulty: 'Medium' },
//   { id: 50, title: 'Rotting Oranges', solved: false, difficulty: 'Medium' },
//   { id: 75, title: 'Maximum XOR of Two Numbers in an Array', solved: false, difficulty: 'Medium' },
//   { id: 76, title: 'Distinct Subsequences', solved: false, difficulty: 'Hard' },
//   { id: 77, title: 'Minimum Number of Bracket Reversals', solved: false, difficulty: 'Not Available on LeetCode' },
//   { id: 78, title: 'Rabin Karp Algorithm', solved: false, difficulty: 'Not Available on LeetCode' },
//   { id: 79, title: 'Z-Algorithm', solved: false, difficulty: 'Not Available on LeetCode' },
//   { id: 80, title: 'KMP Algorithm', solved: false, difficulty: 'Not Available on LeetCode' },
// ];


// app.get('/get-progress/:userId', async (req, res) => {
//   const userId = req.params.userId;

//   try {
//     // Find the user by their userId
//     const user = await User.findOne({ uid: userId });

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     if (!user.leetcodeProfileId) {
//       return res.status(400).json({ message: 'LeetCode username not linked' });
//     }

//     // Fetch user stats from the new LeetCode API
//     const response = await axios.get(`https://leetcode-api-faisalshohag.vercel.app/${user.leetcodeProfileId}`);

//     if (!response.data || !response.data.recentSubmissions) {
//       return res.status(500).json({ message: 'Failed to fetch LeetCode stats' });
//     }

//     const { totalSolved, recentSubmissions } = response.data;  // Extracting total solved problems and recent submissions

//     // Track how many problems from Striver's DSA Sheet the user has solved
//     let solvedCount = 0;

//     // Iterate over Striver's DSA problems
//     striverDSAProblems.forEach(problem => {
//       // Check if the problem is in the user's recent submissions and is marked as "Accepted"
//       recentSubmissions.forEach(submission => {
//         if (submission.titleSlug === problem.title.toLowerCase().replace(/ /g, '-')
//             && submission.statusDisplay === 'Accepted') {
//           problem.solved = true;
//           solvedCount++;
//         }
//       });
//     });

//     // Calculate the progress as a percentage
//     const progress = (solvedCount / striverDSAProblems.length) * 100;

//     // Update the user's solved questions count
//     user.solvedQuestions = totalSolved;
//     user.leetcodeLastUpdated = new Date();
//     await user.save();

//     // Send the updated progress bar data back to the frontend
//     res.json({
//       solvedQuestions: totalSolved,
//       leetcodeLastUpdated: user.leetcodeLastUpdated,
//       striverDSAProgress: {
//         solvedCount,
//         totalCount: striverDSAProblems.length,
//         progressPercentage: progress.toFixed(2),  // Rounded to 2 decimal places
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching LeetCode progress:', error.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// app.get("/get-progress/:userId", async (req, res) => {
//   const userId = req.params.userId;

//   try {
//     // 1️⃣ Find the user in MongoDB
//     const user = await User.findOne({ uid: userId });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (!user.leetcodeProfileId) {
//       return res.status(400).json({ message: "LeetCode username not linked" });
//     }

//     // 2️⃣ Fetch user submissions from LeetCode API
//     const response = await axios.get(`https://leetcode-api-faisalshohag.vercel.app/${user.leetcodeProfileId}`);

//     if (!response.data || !response.data.recentSubmissions || !response.data.submissionCalendar) {
//       return res.status(500).json({ message: "Failed to fetch LeetCode stats" });
//     }

//     const { totalSolved, recentSubmissions, submissionCalendar } = response.data; // Extract total solved & recent submissions
//     console.log(totalSolved)
//     console.log(submissionCalendar)
//     // Fetch all Striver DSA problems from MongoDB
//     const striverDSAProblems = await Problem.find();

//     // Track solved count
//     let solvedCount = 0;

//     // Iterate over Striver's DSA problems
//     for (const problem of striverDSAProblems) {
//       // Check if the problem is in the user's recent submissions and is "Accepted"
//       if (
//         recentSubmissions.some(
//           (submission) =>
//             submission.titleSlug ===
//               problem.title.toLowerCase().replace(/ /g, "-") &&
//             submission.statusDisplay === "Accepted"
//         )
//       ) {
//         // problem.solved = true;
        
//         solvedCount++;

//                // Add the problem to the user's solvedProblems array in the User collection
//                if (!user.solvedProblems.includes(problem.title)) {
//                 user.solvedProblems.push(problem.title);
//               }
//       }
//     }

//     // Calculate progress percentage
//     const progress = (solvedCount / striverDSAProblems.length) * 100;

//     // Update the user's solved questions count
//     user.solvedQuestions = totalSolved;
//     user.submissionCalendar=submissionCalendar;
//     user.leetcodeLastUpdated = new Date();
//     await user.save();

//     // Send updated progress data to the frontend
//     res.json({
//       solvedQuestions: totalSolved,
//       leetcodeLastUpdated: user.leetcodeLastUpdated,
//       striverDSAProgress: {
//         solvedCount,
//         totalCount: striverDSAProblems.length,
//         progressPercentage: progress.toFixed(2), // Rounded to 2 decimal places
//       },
//       submissionCalendar:submissionCalendar,
//     });
//   } catch (error) {
//     console.error("Error fetching LeetCode progress:", error.message);
//     res.status(500).json({ message: "Server error" });
//   }
// });

//for new ui
app.get("/get-progress/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Find the user by their userId
    const user = await User.findOne({ uid: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.leetcodeProfileId) {
      return res.status(400).json({ message: "LeetCode username not linked" });
    }

    // Fetch user stats from the LeetCode API
    const response = await axios.get(
      `https://leetcode-api-faisalshohag.vercel.app/${user.leetcodeProfileId}?timestamp=${Date.now()}`
    );

    if (!response.data || !response.data.recentSubmissions || !response.data.submissionCalendar) {
      return res.status(500).json({ message: "Failed to fetch LeetCode stats" });
    }

    const { 
      totalSolved, 
      totalSubmissions, 
      ranking, 
      contributionPoint, 
      reputation, 
      submissionCalendar, 
      easySolved, 
      totalEasy, 
      mediumSolved, 
      totalMedium, 
      hardSolved, 
      totalHard 
    } = response.data; // Extract new statistics
    
    console.log(totalSolved);
    console.log(submissionCalendar);

    // Fetch all Striver DSA problems from MongoDB
    const striverDSAProblems = await Problem.find({});

    // Track solved count
    let solvedCount = 0;

    // For difficulty-based progress tracking
    const difficultyCount = {
      easy: { total: 0, solved: 0 },
      medium: { total: 0, solved: 0 },
      hard: { total: 0, solved: 0 },
      other: { total: 0, solved: 0 }
    };

    // Count total problems by difficulty
    striverDSAProblems.forEach(problem => {
      const difficulty = problem.difficulty.toLowerCase();
      if (difficulty === 'easy') {
        difficultyCount.easy.total++;
      } else if (difficulty === 'medium') {
        difficultyCount.medium.total++;
      } else if (difficulty === 'hard') {
        difficultyCount.hard.total++;
      } else {
        difficultyCount.other.total++;
      }
    });

    // Iterate over Striver's DSA problems
    for (const problem of striverDSAProblems) {
      const isSolved = user.solvedProblems.includes(problem.title);
      
      // Count solved problems by difficulty
      if (isSolved) {
        solvedCount++;
        const difficulty = problem.difficulty.toLowerCase();
        if (difficulty === 'easy') {
          difficultyCount.easy.solved++;
        } else if (difficulty === 'medium') {
          difficultyCount.medium.solved++;
        } else if (difficulty === 'hard') {
          difficultyCount.hard.solved++;
        } else {
          difficultyCount.other.solved++;
        }
      }

      // Check if the problem is in the user's recent submissions and is "Accepted"
      if (
        response.data.recentSubmissions.some(
          (submission) =>
            submission.titleSlug ===
              problem.title.toLowerCase().replace(/ /g, "-") &&
            submission.statusDisplay === "Accepted"
        ) && !user.solvedProblems.includes(problem.title)
      ) {
        // Only add if it's not already in the solved list
        user.solvedProblems.push(problem.title);
      }
    }

    // Calculate progress percentage for Striver DSA problems
    const progress = (user.solvedProblems.length / striverDSAProblems.length) * 100;

    // Update the user's solved questions count and other stats
    user.solvedQuestions = totalSolved;
    user.submissionCalendar = submissionCalendar;
    user.leetcodeLastUpdated = new Date();
    await user.save();

    // Calculate percentages for each difficulty
    const difficultyProgress = {
      easy: {
        solved: difficultyCount.easy.solved,
        total: difficultyCount.easy.total,
        percentage: difficultyCount.easy.total > 0 
          ? (difficultyCount.easy.solved / difficultyCount.easy.total * 100).toFixed(2) 
          : 0
      },
      medium: {
        solved: difficultyCount.medium.solved,
        total: difficultyCount.medium.total,
        percentage: difficultyCount.medium.total > 0 
          ? (difficultyCount.medium.solved / difficultyCount.medium.total * 100).toFixed(2) 
          : 0
      },
      hard: {
        solved: difficultyCount.hard.solved,
        total: difficultyCount.hard.total,
        percentage: difficultyCount.hard.total > 0 
          ? (difficultyCount.hard.solved / difficultyCount.hard.total * 100).toFixed(2) 
          : 0
      }
    };

    // Send updated progress data to the frontend
    res.json({
      solvedQuestions: totalSolved,
      totalSubmissions,
      ranking,
      contributionPoint,
      reputation,
      submissionCalendar,
      striverDSAProgress: {
        solvedCount2: user.solvedProblems.length,
        totalCount: striverDSAProblems.length,
        progressPercentage: progress.toFixed(2), // Rounded to 2 decimal places
        difficultyProgress: difficultyProgress // Include the difficulty breakdown
      },
      easySolved,
      totalEasy,
      mediumSolved,
      totalMedium,
      hardSolved,
      totalHard,
      striverDSAProgressPercentage: progress.toFixed(2),
    });
  } catch (error) {
    console.error("Error fetching LeetCode progress:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});


// app.get("/get-progress/:userId", async (req, res) => {
//   const userId = req.params.userId;

//   try {
//     // 1️⃣ Find the user in MongoDB
//     const user = await User.findOne({ uid: userId });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (!user.leetcodeProfileId) {
//       return res.status(400).json({ message: "LeetCode username not linked" });
//     }

//     // 2️⃣ Fetch user submissions from LeetCode API
//     const response = await axios.get(`https://leetcode-api-faisalshohag.vercel.app/${user.leetcodeProfileId}`);

//     if (!response.data || !response.data.recentSubmissions) {
//       return res.status(500).json({ message: "Failed to fetch LeetCode stats" });
//     }

//     const { totalSolved, recentSubmissions } = response.data; // Extract total solved count and submissions

//     // 3️⃣ Compare solved problems with Striver's DSA Sheet
//     let solvedProblems = [];

//     striverDSAProblems.forEach((problem) => {
//       if (
//         recentSubmissions.some(
//           (submission) =>
//             submission.titleSlug === problem.title.toLowerCase().replace(/ /g, "-") &&
//             submission.statusDisplay === "Accepted"
//         )
//       ) {
//         solvedProblems.push(problem.title.toLowerCase().replace(/ /g, "-"));
//       }
//     });

//     // 4️⃣ Calculate progress
//     const solvedCount = solvedProblems.length;
//     const progressPercentage = ((solvedCount / striverDSAProblems.length) * 100).toFixed(2);

//     // 5️⃣ Update User Model
//     user.solvedQuestions = totalSolved;
//     user.solvedProblems = solvedProblems; // Store solved problems from Striver's sheet
//     user.leetcodeLastUpdated = new Date();
//     await user.save();

//     // 6️⃣ Return the updated progress
//     res.json({
//       solvedQuestions: totalSolved,
//       leetcodeLastUpdated: user.leetcodeLastUpdated,
//       striverDSAProgress: {
//         solvedCount,
//         totalCount: striverDSAProblems.length,
//         progressPercentage,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching LeetCode progress:", error.message);
//     res.status(500).json({ message: "Server error" });
//   }
// });

app.get("/api/dsa-problems", async (req, res) => {
  const userUID = req.query.uid; // Getting the user UID from query parameters

  if (!userUID) {
    return res.status(400).json({ error: "User UID is required" });
  }

  try {
    // Fetch all DSA problems from the Problem model
    const problems = await Problem.find({});

    // Fetch the user data to get their solved problems (user schema should include this data)
    const user = await User.findOne({ uid: userUID });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const solvedProblems = new Set(user.solvedProblems); // Use a Set to efficiently check if a problem is solved
    console.log(solvedProblems)
    // Mark each problem as solved or not based on the user's solved problems
    const problemsWithStatus = problems.map(problem => ({
      ...problem.toObject(),
      solved: solvedProblems.has(problem.title) // Check if the problem is in the solved list
    }));
    console.log(problemsWithStatus)
    res.json(problemsWithStatus); // Send problems with their solved status
  } catch (error) {
    console.error("Error fetching DSA problems:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/dsa-problems/:title", async (req, res) => {  // Changed from :id to :title
  const { title } = req.params;  // Get the problem title from URL params
  const { solved, uid } = req.body;  // Get solved status and user ID from the request body
  
  console.log("Title received in backend:", title);  // Debugging: Check the title being passed
  
  try {
    // Find the user by UID
    const user = await User.findOne({ uid: uid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's solvedProblems array
    if (solved) {
      // Add the problem to the solvedProblems array if it's marked as solved
      if (!user.solvedProblems.includes(title)) {
        user.solvedProblems.push(title);
      }
    } else {
      // Remove the problem from the solvedProblems array if it's marked as unsolved
      user.solvedProblems = user.solvedProblems.filter(problemTitle => problemTitle !== title);
    }

    // Save the user document with the updated solvedProblems array
    await user.save();
    res.status(200).json({ message: "Solved problems updated successfully" });
  } catch (error) {
    console.error("Error updating solved problems:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// // Route to update the solved status of a problem
// app.patch("/api/dsa-problems/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { solved } = req.body;

//     // Toggle the solved status based on the current value
//     const newSolvedStatus = solved ? false : true;

//     // Update the problem in the database with the new solved status
//     const problem = await Problem.findOneAndUpdate(
//       { id: id },
//       { solved: newSolvedStatus },
//       { new: true }
//     );

//     if (!problem) {
//       return res.status(404).json({ error: "Problem not found" });
//     }

//     res.json({ message: "Solved status updated successfully", problem });
//   } catch (error) {
//     res.status(500).json({ error: "Internal server error" });
//   }
// });



// app.post('/create-profile', upload.single('profilePic'), async (req, res) => {
//   const { uid, username, email, preferredLanguage, preferredSolvingTime,leetcodeProfileId } = req.body;
//   console.log("username",username)
//   console.log("username",leetcodeProfileId)
//   if (!username || !uid || !email || !preferredLanguage || !preferredSolvingTime || !leetcodeProfileId || !req.file) {
//     return res.status(400).json({ message: 'Missing required fields' });
//   }

//   try {
//     const profilePicUrl = `${baseUrl}/uploads/${req.file.filename}`;
  
//     const newUser = new User({
//       uid,
//       username,
//       email,
//       preferredLanguage,
//       preferredSolvingTime,
//       profilePic: profilePicUrl,
//       leetcodeProfileId,
//     });
//     //console.log(existingUser)
//     //console.log("newuser:",newUser)
    
//     await newUser.save();
//     res.status(200).json({ message: 'Profile created successfully', user: newUser });
//   } catch (err) {
//     console.error('Error creating profile:', err);
//     res.status(500).json({ message: 'Error creating profile', error: err.message });
//   }
// });


// Updated API endpoint (routes/user.routes.js)
app.post('/create-profile', upload.single('profilePic'), async (req, res) => {
  const { 
    uid, 
    username, 
    email, 
    preferredLanguage, 
    preferredSolvingTime, 
    leetcodeProfileId,
    dsaSheet,
    dailyProblems,
    codingGoal,
    codingLevel,
    codingSpeed,
    solvePreference,
    partnerPreference,
    bio
  } = req.body;
  
  console.log("username", username);
  console.log("leetcodeProfileId", leetcodeProfileId);
  
  // Validate required fields
  if (!username || !uid || !email || !preferredLanguage || !preferredSolvingTime || !leetcodeProfileId || !req.file) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    const profilePicUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    // Check if user already exists
    const existingUser = await User.findOne({ uid });
    
    if (existingUser) {
      // Update existing user with profile information
      existingUser.username = username;
      existingUser.email = email;
      existingUser.preferredLanguage = preferredLanguage;
      existingUser.preferredSolvingTime = preferredSolvingTime;
      existingUser.profilePic = profilePicUrl;
      existingUser.leetcodeProfileId = leetcodeProfileId;
      existingUser.dsaSheet = dsaSheet || "";
      existingUser.dailyProblems = dailyProblems || "";
      existingUser.codingGoal = codingGoal || "";
      existingUser.codingLevel = codingLevel || "";
      existingUser.codingSpeed = codingSpeed || "";
      existingUser.solvePreference = solvePreference || "";
      existingUser.partnerPreference = partnerPreference || "";
      existingUser.bio = bio || "";
      
      await existingUser.save();
      return res.status(200).json({ message: 'Profile updated successfully', user: existingUser });
    } else {
      // Create new user if doesn't exist (this will handle Google Auth case)
      const newUser = new User({
        uid,
        username,
        email,
        preferredLanguage,
        preferredSolvingTime,
        profilePic: profilePicUrl,
        leetcodeProfileId,
        dsaSheet: dsaSheet || "",
        dailyProblems: dailyProblems || "",
        codingGoal: codingGoal || "",
        codingLevel: codingLevel || "",
        codingSpeed: codingSpeed || "",
        solvePreference: solvePreference || "",
        partnerPreference: partnerPreference || "",
        bio: bio || ""
      });
      
      await newUser.save();
      return res.status(200).json({ message: 'Profile created successfully', user: newUser });
    }
  } catch (err) {
    console.error('Error creating profile:', err);
    res.status(500).json({ message: 'Error creating profile', error: err.message });
  }
});




// app.put('/update-profile', upload.single('profilePic'), async (req, res) => {
//   const { uid, username, preferredLanguage, preferredSolvingTime } = req.body;

//   if (!uid || !username || !preferredLanguage || !preferredSolvingTime) {
//     return res.status(400).json({ message: 'Missing required fields' });
//   }

//   try {
//     const updatedFields = {
//       username,
//       preferredLanguage,
//       preferredSolvingTime,
//     };

//     if (req.file) {
//       const profilePicUrl = `${baseUrl}/uploads/${req.file.filename}`;
//       updatedFields.profilePic = profilePicUrl;
//     }

//     const existingUser = await User.findOne({ uid });

//     if (!existingUser) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Update user profile with new values
//     existingUser.username = username;
//     existingUser.preferredLanguage = preferredLanguage;
//     existingUser.preferredSolvingTime = preferredSolvingTime;

//     // Only update profile picture if it's provided
//     if (updatedFields.profilePic) {
//       existingUser.profilePic = updatedFields.profilePic;
//     }

//     await existingUser.save();

//     res.status(200).json({ message: 'Profile updated successfully', user: existingUser });
//   } catch (err) {
//     console.error('Error updating profile:', err);
//     res.status(500).json({ message: 'Error updating profile', error: err.message });
//   }
// });

app.put('/update-profile', upload.single('profilePic'), async (req, res) => {
  const { 
    uid, 
    username, 
    preferredLanguage, 
    preferredSolvingTime,
    dsaSheet,
    dailyProblems,
    codingGoal,
    codingLevel,
    codingSpeed,
    solvePreference,
    partnerPreference,
    bio
  } = req.body;

  // Check for required fields
  if (!uid || !username || !preferredLanguage || !preferredSolvingTime) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Build update object with all possible fields
    const updatedFields = {
      username,
      preferredLanguage,
      preferredSolvingTime,
    };

    // Add optional fields if they exist
    if (dsaSheet) updatedFields.dsaSheet = dsaSheet;
    if (dailyProblems) updatedFields.dailyProblems = dailyProblems;
    if (codingGoal) updatedFields.codingGoal = codingGoal;
    if (codingLevel) updatedFields.codingLevel = codingLevel;
    if (codingSpeed) updatedFields.codingSpeed = codingSpeed;
    if (solvePreference) updatedFields.solvePreference = solvePreference;
    if (partnerPreference) updatedFields.partnerPreference = partnerPreference;
    if (bio) updatedFields.bio = bio;

    // Handle profile picture if uploaded
    if (req.file) {
      const profilePicUrl = `${baseUrl}/uploads/${req.file.filename}`;
      updatedFields.profilePic = profilePicUrl;
    }

    // Find user by UID
    const existingUser = await User.findOne({ uid });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update all fields from updatedFields object
    Object.keys(updatedFields).forEach(key => {
      existingUser[key] = updatedFields[key];
    });

    await existingUser.save();

    res.status(200).json({ 
      message: 'Profile updated successfully', 
      user: existingUser 
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ 
      message: 'Error updating profile', 
      error: err.message 
    });
  }
});

app.get('/user/:uid', async (req, res) => {
  const { uid } = req.params;

  if (!uid) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ message: 'Error fetching user data', error: err.message });
  }
});

// Add this route to get the last message timestamp for each chat partner
app.get('/api/messages/last-timestamps', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Find the latest message for each conversation
    const latestMessages = await Message.aggregate([
      // Match messages where the current user is either sender or receiver
      { 
        $match: { 
          $or: [
            { senderUID: userId },
            { receiverUID: userId }
          ]
        }
      },
      // Sort by timestamp descending (newest first)
      { $sort: { timestamp: -1 } },
      // Group by the other user in the conversation
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderUID", userId] },
              "$receiverUID", // If user is sender, group by receiver
              "$senderUID"    // If user is receiver, group by sender
            ]
          },
          latestTimestamp: { $first: "$timestamp" } // Get the first (newest) timestamp
        }
      }
    ]);
    
    // Convert to a more convenient format for the frontend
    const timestampMap = {};
    latestMessages.forEach(msg => {
      timestampMap[msg._id] = msg.latestTimestamp;
    });
    
    res.status(200).json(timestampMap);
  } catch (error) {
    console.error('Error fetching last message timestamps:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} ${baseUrl}`));
console.log(PORT);
module.exports = app; // Export for testing or further modularization


// // const PORT = process.env.PORT || 5000;
// server.listen(PORT, '0.0.0.0', () => {
//   console.log(`Test server running at http://0.0.0.0:${PORT}`);
// });