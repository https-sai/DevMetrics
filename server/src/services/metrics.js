const Commit = require("../models/Commit");
const PullRequest = require("../models/PullRequest");
const Repository = require("../models/Repository");

async function getCommitFrequency({ userId, repoId, from, to }) {
  // Find repos belonging to this user
  const repoQuery = { userId };
  if (repoId) repoQuery._id = repoId;
  const repos = await Repository.find(repoQuery).select("_id");
  const repoIds = repos.map((r) => r._id);

  return Commit.aggregate([
    {
      $match: {
        repoId: { $in: repoIds },
        committedAt: { $gte: new Date(from), $lte: new Date(to) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$committedAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: "$_id", count: 1 } },
  ]);
}

async function getCycleTime({ userId, repoId, from, to }) {
  const repoQuery = { userId };
  if (repoId) repoQuery._id = repoId;
  const repos = await Repository.find(repoQuery).select("_id");
  const repoIds = repos.map((r) => r._id);

  return PullRequest.aggregate([
    {
      $match: {
        repoId: { $in: repoIds },
        mergedAt: { $gte: new Date(from), $lte: new Date(to), $ne: null },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$mergedAt" } },
        avgHours: { $avg: "$cycleTimeHours" },
        prCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: "$_id",
        avgHours: { $round: ["$avgHours", 2] },
        prCount: 1,
      },
    },
  ]);
}

module.exports = { getCommitFrequency, getCycleTime };
