const express = require("express");
require("dotenv").config();
const { connectDB } = require("./db/mongoose");

const app = express();
const PORT = process.env.PORT || 3001;

app.get("/health", (req, res) => res.json({ status: "ok" }));

// call connectDB() before starting the HTTP server
async function start() {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
