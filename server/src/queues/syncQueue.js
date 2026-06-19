const { Queue } = require("bullmq");
const IORedis = require("ioredis");
const { REDIS_URL } = require("../config");

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

const syncQueue = new Queue("sync", { connection });

module.exports = syncQueue;
