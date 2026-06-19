require("dotenv").config();

const required = [
  "MONGODB_URI",
  "REDIS_URL",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_WEBHOOK_SECRET",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "CLIENT_URL",
];

required.forEach((key) => {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
});

module.exports = {
  PORT: process.env.PORT || 3001,
  MONGODB_URI: process.env.MONGODB_URI,
  REDIS_URL: process.env.REDIS_URL,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  CLIENT_URL: process.env.CLIENT_URL,
};
