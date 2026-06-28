const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { CLIENT_URL, PORT } = require("./config");
const { connectDB } = require("./db/mongoose");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const repoRoutes = require("./routes/repos");
const metricsRoutes = require("./routes/metrics");
const webhookRoutes = require("./routes/webhooks");

const app = express();

app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(morgan("dev"));

// Webhook route needs raw body for signature verification.
// Must be registered BEFORE express.json() parses the body.
app.use(
  "/api/webhooks",
  express.raw({ type: "application/json" }),
  webhookRoutes,
);

app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/repos", repoRoutes);
app.use("/api/metrics", metricsRoutes);

// Error handler must be the last middleware registered
app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
