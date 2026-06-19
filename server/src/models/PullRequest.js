const mongoose = require("mongoose");

const pullRequestSchema = new mongoose.Schema({
  repoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Repository",
    required: true,
  },
  githubPrId: { type: Number, required: true, unique: true },
  number: Number,
  title: String,
  state: String,
  openedAt: Date,
  closedAt: Date,
  mergedAt: Date,
  cycleTimeHours: Number,
  additions: { type: Number, default: 0 },
  deletions: { type: Number, default: 0 },
});

pullRequestSchema.index({ repoId: 1, state: 1 });
pullRequestSchema.index({ mergedAt: -1 }, { sparse: true });

module.exports = mongoose.model("PullRequest", pullRequestSchema);
