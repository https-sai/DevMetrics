// DB connection module
const mongoose = require("mongoose");
const { MONGODB_URI } = require("../config");

let isConnected = false;

// connect to MongoDB and set isConnected to true
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(MONGODB_URI);
  isConnected = true;
  console.log("MongoDB connected");
}

module.exports = { connectDB };
