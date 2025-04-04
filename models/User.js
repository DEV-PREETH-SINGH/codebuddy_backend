// Updated User Model (user.model.js)
const mongoose = require('mongoose');

// Define the updated User schema
const UserSchema = new mongoose.Schema({
  // Basic information
  username: {
    type: String
  },
  email: {
    type: String
  },
  uid: {
    type: String,
    required: true,
    unique: true
  },
  dateJoined: {
    type: Date,
    default: Date.now
  },
  profilePic: {
    type: String
  }, // Store image URL
  
  // Step 1 information
  preferredLanguage: {
    type: String
  },
  preferredSolvingTime: {
    type: String
  },
  dsaSheet: {
    type: String,
    default: ""
  },
  dailyProblems: {
    type: String,
    default: ""
  },
  
  // Step 2 information
  codingGoal: {
    type: String,
    default: ""
  },
  codingLevel: {
    type: String,
    default: ""
  },
  codingSpeed: {
    type: String,
    default: ""
  },
  
  // Step 3 information
  solvePreference: {
    type: String,
    default: ""
  },
  partnerPreference: {
    type: String,
    default: ""
  },
  
  // Step 4 information
  bio: {
    type: String,
    default: ""
  },
  
  // Activity tracking
  clickedStartToday: {
    type: Boolean,
    default: false
  },
  
  // 🟢 LeetCode Integration
  leetcodeProfileId: {
    type: String,
    default: ""
  },
  solvedQuestions: {
    type: Number,
    default: 0
  },
  solvedProblems: {
    type: [String],
    default: []
  },
  leetcodeLastUpdated: {
    type: Date,
    default: null
  },
  
  // Partner and streak info
  partner: {
    type: String,
    default: null
  }, // Stores the partner's user ID
  pendingRequest: {
    type: [String],
    default: []
  }, // Stores the user ID of the pending request
  streakCount: {
    type: Number,
    default: 0
  },
  lastStreakUpdate: { 
    type: Date, 
    default: null 
  }
});

// Create a User model based on the updated schema
module.exports = mongoose.model('User', UserSchema);