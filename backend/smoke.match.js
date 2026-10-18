// --- In-memory AiUsage model fake (per-user daily quota counters) ---
const quotaCounts = new Map();
const aiUsagePath = require.resolve("./src/models/aiUsage.model");
require(aiUsagePath);
require.cache[aiUsagePath].exports = {
  async findOneAndUpdate(filter, update) {
    const key = `${filter.user}|${filter.day}`;
    const next = (quotaCounts.get(key) || 0) + (update.$inc?.count || 0);
    quotaCounts.set(key, next);
    return { user: filter.user, day: filter.day, count: next };
  },
};
