// Per-user daily AI usage quota.
//
// Policy: each authenticated user gets AI_DAILY_LIMIT (default 30) AI-powered
// calls per UTC day across the ATS analyzer, job matcher, and interview
// generator combined. The counter increments BEFORE the AI call runs, so
// failed calls still count — this prevents retry-spam from dodging the
// quota. When the limit is reached the endpoint returns 429 with the limit
// and the UTC reset time; no AI call is made.
//
// Must run AFTER authMiddleware (it needs req.user.id).
const AiUsage = require("../models/aiUsage.model");
const config = require("../utils/env");
const asyncHandler = require("../utils/asyncHandler");

function utcDayString() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function nextUtcMidnightIso(day) {
  return new Date(
    Date.parse(`${day}T00:00:00Z`) + 24 * 60 * 60 * 1000,
  ).toISOString();
}

const aiQuota = asyncHandler(async (req, res, next) => {
  const limit = config.aiDailyLimit;
  const day = utcDayString();

  const usage = await AiUsage.findOneAndUpdate(
    { user: req.user.id, day },
    { $inc: { count: 1 } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  );

  const remaining = Math.max(0, limit - usage.count);
  res.set("X-AI-Quota-Limit", String(limit));
  res.set("X-AI-Quota-Remaining", String(remaining));

  if (usage.count > limit) {
    return res.status(429).json({
      error: `Daily AI usage limit reached (${limit} requests per day). Your quota resets at ${nextUtcMidnightIso(day)}.`,
      limit,
      resetsAt: nextUtcMidnightIso(day),
    });
  }

  next();
});

module.exports = aiQuota;
