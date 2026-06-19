const mongoose = require("mongoose");

const repositorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    githubRepoId: { type: Number, required: true, unique: true },
    owner: { type: String, required: true },
    name: { type: String, required: true },
    fullName: { type: String, required: true },
    private: { type: Boolean, default: false },
    syncedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Repository", repositorySchema);
