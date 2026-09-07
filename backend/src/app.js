const express = require("express");
const cors = require("cors");
const app = express();
// const invokeGeminiAi = require("./services/ai.service");
// invokeGeminiAi();
// const { resume, selfDescription, jobDescription } = require("./services/temp");
// const { generateInterviewReport } = require("./services/ai.service");
// generateInterviewReport({ resume, selfDescription, jobDescription });
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
const connectDB = require("./config/database");
const dotenv = require("dotenv");
dotenv.config();

connectDB();

app.use(express.json());

// Define routes

const authRoutes = require("./routes/auth.route");
const interviewRouter = require("./routes/interview.route");

// using all routes here
app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRouter);

module.exports = app;
