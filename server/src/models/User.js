const mongoose = require("mongoose");

const oauthTokenSchema = new mongoose.Schema(
  {
    accessToken: { type: String, required: true },
    scope: String,
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    githubId: { type: Number, required: true, unique: true },
    username: { type: String, required: true },
    avatarUrl: String,
    email: String,
    oauthToken: oauthTokenSchema,
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
