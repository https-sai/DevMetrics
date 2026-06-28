const axios = require("axios");
const User = require("../models/User");
const Repository = require("../models/Repository");
const Commit = require("../models/Commit");
const PullRequest = require("../models/PullRequest");

async function getToken(userId) {
  const user = await User.findById(userId).select("oauthToken");
  return user.oauthToken.accessToken;
}

// Rate-limit-aware GitHub API wrapper
async function ghGet(path, token, params = {}) {
  const res = await axios.get(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    params,
  });

  const remaining = parseInt(res.headers["x-ratelimit-remaining"]);
  if (remaining < 10) {
    const reset = parseInt(res.headers["x-ratelimit-reset"]) * 1000;
    const wait = Math.max(reset - Date.now(), 1000);
    console.log(`Rate limit low (${remaining} remaining). Pausing ${wait}ms.`);
    await new Promise((r) => setTimeout(r, wait));
  }

  return res;
}

async function syncCommits(repo, token) {
  let page = 1;
  while (true) {
    const res = await ghGet(`/repos/${repo.fullName}/commits`, token, {
      per_page: 100,
      page,
    });
    if (!res.data.length) break;

    const ops = res.data.map((commit) => ({
      updateOne: {
        filter: { sha: commit.sha },
        update: {
          $setOnInsert: {
            repoId: repo._id,
            sha: commit.sha,
            authorGithubId: commit.author?.id,
            message: commit.commit.message.slice(0, 500),
            committedAt: commit.commit.committer.date,
          },
        },
        upsert: true,
      },
    }));
    if (ops.length) await Commit.bulkWrite(ops, { ordered: false });

    // Fetch and update stats separately (additions/deletions require individual calls)
    for (const commit of res.data) {
      const detail = await ghGet(
        `/repos/${repo.fullName}/commits/${commit.sha}`,
        token,
      );
      await Commit.updateOne(
        { sha: commit.sha },
        {
          $set: {
            additions: detail.data.stats?.additions || 0,
            deletions: detail.data.stats?.deletions || 0,
            changedFiles: detail.data.files?.length || 0,
          },
        },
      );
    }

    if (res.data.length < 100) break;
    page++;
  }
}

async function syncPullRequests(repo, token) {
  let page = 1;
  while (true) {
    const res = await ghGet(`/repos/${repo.fullName}/pulls`, token, {
      state: "all",
      per_page: 100,
      page,
    });
    if (!res.data.length) break;

    const ops = res.data.map((pr) => {
      const cycleTimeHours = pr.merged_at
        ? parseFloat(
            (
              (new Date(pr.merged_at) - new Date(pr.created_at)) /
              (1000 * 60 * 60)
            ).toFixed(2),
          )
        : null;

      return {
        updateOne: {
          filter: { githubPrId: pr.id },
          update: {
            $setOnInsert: {
              repoId: repo._id,
              githubPrId: pr.id,
              number: pr.number,
              title: pr.title,
              state: pr.state,
              openedAt: pr.created_at,
              closedAt: pr.closed_at,
              mergedAt: pr.merged_at,
              cycleTimeHours,
              additions: pr.additions || 0,
              deletions: pr.deletions || 0,
            },
          },
          upsert: true,
        },
      };
    });
    if (ops.length) await PullRequest.bulkWrite(ops, { ordered: false });

    if (res.data.length < 100) break;
    page++;
  }
}

async function processFullSync({ repoId, userId }) {
  const token = await getToken(userId);
  const repo = await Repository.findById(repoId);

  if (!repo?.fullName) {
    throw new Error(
      `Repository ${repoId} is missing fullName — re-add it from Settings`,
    );
  }

  console.log(`Syncing ${repo.fullName} (${repoId})`);
  await syncCommits(repo, token);
  await syncPullRequests(repo, token);

  await Repository.findByIdAndUpdate(repoId, { syncedAt: new Date() });
}

async function processPushEvent({ payload }) {
  // Handle incremental commit sync from push webhook
  // Implementation: find the repo by payload.repository.id, sync only new commits
  console.log("Processing push event for", payload.repository?.full_name);
}

async function processPREvent({ payload }) {
  // Handle PR open/close/merge events from webhook
  console.log("Processing PR event for", payload.repository?.full_name);
}

module.exports = { processFullSync, processPushEvent, processPREvent };
