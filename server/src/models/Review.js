const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  prId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PullRequest",
    required: true,
  },
  reviewerGithubId: Number,
  state: String,
  submittedAt: Date,
  turnaroundHours: Number,
});

reviewSchema.index({ prId: 1 });

module.exports = mongoose.model("Review", reviewSchema);
