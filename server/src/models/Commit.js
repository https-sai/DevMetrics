const mongoose = require("mongoose");

const commitSchema = new mongoose.Schema({
  repoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Repository",
    required: true,
  },
  sha: { type: String, required: true, unique: true },
  authorGithubId: Number,
  message: String,
  committedAt: Date,
  additions: { type: Number, default: 0 },
  deletions: { type: Number, default: 0 },
  changedFiles: { type: Number, default: 0 },
});

commitSchema.index({ repoId: 1, committedAt: -1 });

module.exports = mongoose.model("Commit", commitSchema);
