const mongoose = require("mongoose");

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
