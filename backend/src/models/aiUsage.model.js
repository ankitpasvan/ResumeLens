const mongoose = require("mongoose");

// Per-user daily AI usage counter for quota enforcement. One document per
// user per UTC day; old documents self-delete after 30 days via TTL.
const aiUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // UTC calendar day as YYYY-MM-DD (string keeps day-boundary math
    // trivial and timezone-independent).
    day: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

aiUsageSchema.index({ user: 1, day: 1 }, { unique: true });
// Keep 30 days of history, then let MongoDB clean up.
aiUsageSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 },
);

const AiUsage = mongoose.model("AiUsage", aiUsageSchema);
module.exports = AiUsage;
