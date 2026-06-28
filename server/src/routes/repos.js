const express = require("express");
const Repository = require("../models/Repository");
const authenticate = require("../middleware/authenticate");
const syncQueue = require("../queues/syncQueue");

const router = express.Router();
router.use(authenticate);

router.post("/", async (req, res, next) => {
  try {
    const {
      githubRepoId = req.body.github_repo_id,
      owner,
      name,
      fullName = req.body.full_name,
      private: isPrivate = req.body.private,
    } = req.body;

    if (!githubRepoId || !owner || !name) {
      return res.status(400).json({
        error: "githubRepoId, owner, and name are required",
      });
    }

    const resolvedFullName = fullName || `${owner}/${name}`;

    const repo = await Repository.findOneAndUpdate(
      { githubRepoId },
      {
        userId: req.user.userId,
        githubRepoId,
        owner,
        name,
        fullName: resolvedFullName,
        private: isPrivate ?? false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Enqueue background sync
    await syncQueue.add(
      "full-sync",
      {
        repoId: repo._id,
        userId: req.user.userId,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    );

    res.status(201).json({ repo, message: "Sync queued" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
