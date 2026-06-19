const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../db/knex");
const authenticate = require("../middleware/authenticate");
const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  CLIENT_URL,
} = require("../config");

const router = express.Router();

// Step 1: Send user to GitHub
router.get("/github", (req, res) => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: "read:user user:email repo",
    state: crypto.randomUUID(),
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// Step 2: GitHub sends user back with a code
router.get("/github/callback", async (req, res, next) => {
  try {
    const { code } = req.query;

    // Exchange code for access token (server-to-server)
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } },
    );

    const { access_token, scope, token_type } = tokenRes.data;

    // Use access token to get the user's GitHub profile
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const ghUser = userRes.data;

    // Upsert user record
    const [user] = await db("users")
      .insert({
        github_id: ghUser.id,
        username: ghUser.login,
        avatar_url: ghUser.avatar_url,
        email: ghUser.email,
      })
      .onConflict("github_id")
      .merge(["username", "avatar_url", "email"])
      .returning("*");

    // Upsert token record
    await db("oauth_tokens")
      .insert({ user_id: user.id, access_token, scope, token_type })
      .onConflict("user_id")
      .merge(["access_token", "scope", "updated_at"]);

    // Issue JWTs
    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    // Redirect to frontend with tokens in URL (cleaned up immediately client-side)
    res.redirect(
      `${CLIENT_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`,
    );
  } catch (err) {
    next(err);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("-oauthToken");
    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
