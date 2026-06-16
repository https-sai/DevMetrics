# DevMetrics

A self-hosted engineering analytics platform that connects to your GitHub account and surfaces meaningful insights about your coding patterns — PR cycle time, review turnaround, and commit frequency.

**[Live demo](https://your-demo-url.example.com)** · Demo login available via "Sign in with GitHub"

---

## Overview

DevMetrics answers a question engineers actually ask: _am I shipping faster this month than last?_ It pulls commit and pull request history from the GitHub API, processes it asynchronously, and presents it as interactive charts — including a hand-built D3 commit heatmap modeled on GitHub's contribution graph.

It is built as a full-stack application with deliberate, defensible engineering decisions throughout, rather than relying on frameworks to make those decisions invisibly.

## Tech Stack

- **Frontend:** React (Vite), React Router, React Query (TanStack Query), D3, Recharts
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Queue:** BullMQ backed by Redis
- **Auth:** GitHub OAuth 2.0, JWT (access + refresh tokens)
- **Infrastructure:** Docker

## Features

- **GitHub OAuth login** — no passwords; authentication is delegated entirely to GitHub
- **Repository tracking** — add any repo you have access to; data syncs automatically in the background
- **Dashboard** — KPI cards (total commits, average cycle time, average review turnaround) and a 52-week commit heatmap
- **Per-repo deep dive** — PR cycle time over time and review turnaround broken down by reviewer
- **Period comparison** — evaluate two date ranges side by side with delta indicators
- **Real-time updates** — GitHub webhooks keep tracked repos current without polling

## Architecture

```
GitHub (OAuth + Webhooks)
      |
      v
React SPA (Vite)  ──HTTP──>  Express API  ──enqueue──>  Redis (BullMQ)
                                  |                          |
                                  v                          v
                              MongoDB  <──read/write──  BullMQ Worker
                                                        (GitHub sync)
```

The API responds to requests in milliseconds and defers slow work — syncing thousands of commits from the GitHub API — to a separate worker process via a job queue. The API and worker run independently and share the same codebase.

## Engineering Decisions

A few choices worth calling out, each made deliberately:

- **In-memory JWT storage, not `localStorage`.** Access tokens live in a JavaScript variable, inaccessible to other scripts, mitigating XSS token theft. Session continuity is handled by a refresh token and a silent re-auth flow in an Axios response interceptor.
- **Webhook signature verification.** Incoming GitHub webhooks are validated with HMAC-SHA256 using `crypto.timingSafeEqual` to prevent timing attacks. The webhook route reads the raw request body, registered before `express.json()` so the signed bytes are preserved.
- **Background processing with retries.** Repo syncs can take well over a minute and exceed any reasonable HTTP timeout, so they run as BullMQ jobs with exponential backoff. Sync logic is idempotent via Mongoose upserts, so re-running a job is safe.
- **Rate-limit-aware GitHub client.** The sync service reads GitHub's `X-RateLimit-Remaining` / `X-RateLimit-Reset` headers and pauses when the budget runs low, rather than failing on large repositories.
- **Hand-rolled D3 heatmap.** The commit heatmap is built from D3 primitives (scales, SVG rects, quantized color) rather than a charting library, mapping each date to an (x, y) grid position and each commit count to a color.

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local MongoDB and Redis)
- A GitHub OAuth App ([create one here](https://github.com/settings/developers))

### 1. Clone and install

```bash
git clone https://github.com/your-username/devmetrics.git
cd devmetrics

# Install dependencies for root, server, and client
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 2. Start local MongoDB and Redis

```bash
docker run -d --name devmetrics-mongo -p 27017:27017 mongo:7
docker run -d --name devmetrics-redis -p 6379:6379 redis:7
```

### 3. Configure environment variables

Create `server/.env` (never commit this file):

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/devmetrics
REDIS_URL=redis://localhost:6379
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_WEBHOOK_SECRET=a_random_string
JWT_SECRET=a_random_secret
JWT_REFRESH_SECRET=a_different_random_secret
CLIENT_URL=http://localhost:5173
```

Generate a secure random value for the secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

When registering your GitHub OAuth App, set the authorization callback URL to:
`http://localhost:3001/api/auth/github/callback`

### 4. Run the app

```bash
# Starts both the API and the frontend dev server
npm run dev
```

In a separate terminal, start the background worker:

```bash
cd server && npm run worker
```

- Frontend: http://localhost:5173
- API health check: http://localhost:3001/health

### 5. (Optional) Forward webhooks locally

To receive GitHub webhook events on your local machine:

```bash
npm install -g smee-client
smee --url https://smee.io/your-channel-id --target http://localhost:3001/api/webhooks/github
```

## Routes

| Route            | Auth | Purpose                                       |
| ---------------- | ---- | --------------------------------------------- |
| `/login`         | No   | GitHub OAuth entry point                      |
| `/auth/callback` | No   | Handles the token from the OAuth redirect     |
| `/`              | Yes  | Dashboard: KPI cards and commit heatmap       |
| `/settings`      | Yes  | Add, remove, and manually sync repositories   |
| `/repos/:repoId` | Yes  | Cycle time and review turnaround for one repo |
| `/compare`       | Yes  | Side-by-side comparison of two time periods   |

## Roadmap

Out of scope for the current build, but natural next steps:

- Team accounts and shared organization dashboards
- Configurable alert thresholds (e.g., notify when cycle time exceeds a limit)
- Code-level metrics beyond timing (diff size, file churn)
- Email or Slack notifications
