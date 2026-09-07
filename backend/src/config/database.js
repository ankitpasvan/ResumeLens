const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    const errorMessage = `Error connecting to MongoDB: ${error.message}`;
    console.error(errorMessage);
    console.error("Database not connected");
    process.exit(1);
  }
};

module.exports = connectDB;
