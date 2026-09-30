const mongoose = require("mongoose");
const config = require("../utils/env");

async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
