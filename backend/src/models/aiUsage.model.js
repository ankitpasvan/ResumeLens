const mongoose = require("mongoose");

const aiUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

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

aiUsageSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 },
);

const AiUsage = mongoose.model("AiUsage", aiUsageSchema);
module.exports = AiUsage;
