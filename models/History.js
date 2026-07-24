const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  jobTitle: String,
  matchScore: Number,
  keySkills: [String],
  missingSkills: [String],
  atsProbability: String,

  // Resume Raw Text
  resumeText: {
    type: String,
  },

  // ✅ Structured Resume (NEW)
  formattedResume: {
    type: Object,
    default: {},
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("History", historySchema);