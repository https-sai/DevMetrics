const express = require("express");
const db = require("../db/knex");
const authenticate = require("../middleware/authenticate");
const syncQueue = require("../queues/syncQueue");

const router = express.Router();
router.use(authenticate);

router.post("/", async (req, res, next) => {
  try {
    const {
      github_repo_id,
      owner,
      name,
      full_name,
      private: isPrivate,
    } = req.body;

    const [repo] = await db("repositories")
      .insert({
        user_id: req.user.userId,
        github_repo_id,
        owner,
        name,
        full_name,
        private: isPrivate,
      })
      .returning("*");

    // Enqueue background sync
    await syncQueue.add(
      "full-sync",
      {
        repoId: repo.id,
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
