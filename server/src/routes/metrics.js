const express = require("express");
const authenticate = require("../middleware/authenticate");
const { getCommitFrequency, getCycleTime } = require("../services/metrics");

const router = express.Router();

// All metrics routes require authentication
router.use(authenticate);

router.get("/commits", async (req, res, next) => {
  try {
    const { repoId, from, to } = req.query;
    const data = await getCommitFrequency({
      userId: req.user.userId,
      repoId,
      from: from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      to: to || new Date(),
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/cycle-time", async (req, res, next) => {
  try {
    const { repoId, from, to } = req.query;
    const data = await getCycleTime({
      userId: req.user.userId,
      repoId,
      from: from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      to: to || new Date(),
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
