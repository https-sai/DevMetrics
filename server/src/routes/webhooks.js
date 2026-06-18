const express = require("express");
const crypto = require("crypto");
const { GITHUB_WEBHOOK_SECRET } = require("../config");
const syncQueue = require("../queues/syncQueue");

const router = express.Router();

function verifySignature(req) {
  const sig = req.headers["x-hub-signature-256"];
  if (!sig) return false;
  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", GITHUB_WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

router.post("/github", async (req, res) => {
  if (!verifySignature(req)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = req.headers["x-github-event"];
  const payload = JSON.parse(req.body.toString());

  if (event === "push") {
    await syncQueue.add(
      "process-push",
      { event, payload },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      },
    );
  }

  if (event === "pull_request") {
    await syncQueue.add(
      "process-pr",
      { event, payload },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      },
    );
  }

  // Acknowledge immediately — processing happens asynchronously
  res.status(202).json({ queued: true });
});

module.exports = router;
