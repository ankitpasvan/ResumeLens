const mongoose = require("mongoose");

// Stores revoked JWTs (from logout) so they can no longer be used.
// Entries expire automatically via a TTL index so the collection
// never grows unboundedly.
const blacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

blacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const blacklistModel = mongoose.model("Blacklist", blacklistSchema);
module.exports = blacklistModel;
