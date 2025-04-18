const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
  id: Number,
  title: String,
  titleSlug: String,  // LeetCode slug
  difficulty: String,
  solved: { type: Boolean, default: false },
  url:String,
});

module.exports = mongoose.model("striver79DsaSheetProblems", problemSchema);
