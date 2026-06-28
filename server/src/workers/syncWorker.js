require("dotenv").config();
const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const { REDIS_URL } = require("../config");
const { connectDB } = require("../db/mongoose");
const {
  processFullSync,
  processPushEvent,
  processPREvent,
} = require("../services/sync");

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

async function start() {
  await connectDB();

  const worker = new Worker(
    "sync",
    async (job) => {
      console.log(`Processing job: ${job.name} (${job.id})`);
      switch (job.name) {
        case "full-sync":
          return await processFullSync(job.data);
        case "process-push":
          return await processPushEvent(job.data);
        case "process-pr":
          return await processPREvent(job.data);
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    },
    { connection, concurrency: 3 },
  );

  worker.on("completed", (job) =>
    console.log(`Job ${job.id} (${job.name}) completed`),
  );
  worker.on("failed", (job, err) =>
    console.error(`Job ${job.id} (${job.name}) failed:`, err.message),
  );

  console.log("Worker started and listening for jobs...");
}

start();
