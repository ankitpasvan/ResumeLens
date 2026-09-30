/* Job-match smoke test: exercises the real HTTP stack (routes,
 * middleware, controllers) for resume↔job matching with in-memory model
 * fakes and a stubbed Gemini feedback call. Also unit-tests the
 * deterministic matcher directly (pure function, no fakes needed). */
process.env.JWT_SECRET = "smoke-test-secret";
process.env.GEMINI_API_KEY = "smoke-test-key";
process.env.MONGO_URI = "mongodb://localhost:27017/smoke";

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { Types } = require("mongoose");

// Pure function: safe to require without any fakes.
const { matchResumeToJob } = require("./src/services/match.service");

const GOOD_RESUME = `
John Doe
john.doe@email.com | +91 98765 43210 | linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Backend developer with 4 years of experience building scalable Node.js APIs and microservices.

WORK EXPERIENCE
Senior Backend Developer - Acme Corp (2022-Present)
- Developed RESTful APIs using Node.js and Express serving 2 million requests per day
- Improved API response time by 40% by optimizing MongoDB queries and adding Redis caching
- Led migration from monolith to microservices with Docker and AWS, reducing deploy time by 60%
- Mentored 5 engineers and implemented CI/CD pipelines, increasing release frequency 3x

Backend Developer - BetaSoft (2020-2022)
- Built real-time notification service handling 10k concurrent users
- Automated test suite with Jest, reducing regression bugs by 35%
- Deployed services on AWS EC2 with Docker containers

EDUCATION
B.Tech Computer Science - XYZ University (2016-2020)

TECHNICAL SKILLS
Node.js, Express, MongoDB, Redis, Docker, AWS, TypeScript, JavaScript, REST APIs, Jest
`;

const WEAK_RESUME = `
Hi I am Rahul.
I know computers. I did some work on websites.
Contact me sometime.
`;

const JOB_TITLE = "Backend Developer (Node.js)";

const JD = `
We are looking for a backend developer with 3+ years of experience building
APIs with Node.js and Express. You will design RESTful services, work with
MongoDB and Redis, and deploy with Docker on AWS.

Required: Node.js, Express, MongoDB, RESTful APIs, Docker, AWS, Redis,
microservices, CI/CD, TypeScript, Kubernetes, GraphQL, system design,
testing, Jest.
`;

const fakeFeedback = {
  summary: "Strong backend fit with most required skills present.",
  strengths: [
    "Node.js and Express experience matches the core stack.",
    "Quantified achievements show real impact.",
  ],
  gaps: [
    {
      issue: "Kubernetes not found in the resume",
      severity: "medium",
      suggestion: "Add any Kubernetes exposure to the projects section.",
    },
  ],
  recommendations: [
    "Highlight the microservices migration more prominently.",
    "Add a Kubernetes learning project.",
  ],
};

function installFakes() {
  // --- Stub Gemini feedback before controllers load ---
  const aiPath = require.resolve("./src/services/ai.service");
  require(aiPath);
  require.cache[aiPath].exports.generateMatchFeedback = async () =>
    JSON.stringify(fakeFeedback);

  // --- In-memory User model fake ---
  const users = [];
  const userPath = require.resolve("./src/models/user.model");
  require(userPath);
  require.cache[userPath].exports = {
    async findOne({ email }) {
      return users.find((u) => u.email === email) || null;
    },
    async create({ username, email, password }) {
      const hash = await bcrypt.hash(password, 10);
      const user = {
        _id: new Types.ObjectId(),
        username,
        email,
        password: hash,
        comparePassword: (candidate) => bcrypt.compare(candidate, hash),
        toObject() {
          return { _id: this._id, username, email };
        },
      };
      users.push(user);
      return user;
    },
    findById(id) {
      const user = users.find((u) => String(u._id) === String(id)) || null;
      return {
        select: async () => {
          if (!user) return null;
          const { password: _pw, ...rest } = user;
          return rest;
        },
      };
    },
  };

  // --- In-memory Blacklist model fake ---
  const blacklisted = new Set();
  const blacklistPath = require.resolve("./src/models/blacklist.model");
  require(blacklistPath);
  require.cache[blacklistPath].exports = {
    async create({ token }) {
      blacklisted.add(token);
      return { token };
    },
    async findOne({ token }) {
      return blacklisted.has(token) ? { token } : null;
    },
  };

  // --- In-memory Resume model fake ---
  const resumes = [];
  const resumePath = require.resolve("./src/models/resume.model");
  require(resumePath);
  require.cache[resumePath].exports = {
    async countDocuments(filter = {}) {
      return resumes.filter((r) => String(r.user) === String(filter.user))
        .length;
    },
    async create(doc) {
      const saved = {
        _id: new Types.ObjectId(),
        createdAt: new Date(),
        ...doc,
      };
      resumes.push(saved);
      return saved;
    },
    findOne(filter = {}) {
      const owned = resumes.filter(
        (r) => String(r.user) === String(filter.user),
      );
      // Explicit resume lookup (owner-scoped).
      if (filter._id) {
        return owned.find((r) => String(r._id) === String(filter._id)) || null;
      }
      // Primary-resume lookup.
      if (filter.isPrimary) {
        return owned.find((r) => r.isPrimary) || null;
      }
      // Newest-resume fallback: supports .sort({ createdAt: -1 }).
      return {
        sort: async () =>
          [...owned].sort((a, b) => b.createdAt - a.createdAt)[0] || null,
      };
    },
  };

  // --- In-memory JobMatch model fake (mimics CastError like mongoose) ---
  const matches = [];
  const matchPath = require.resolve("./src/models/jobMatch.model");
  require(matchPath);
  const castError = () => {
    const e = new Error("Cast to ObjectId failed");
    e.name = "CastError";
    return e;
  };
  require.cache[matchPath].exports = {
    async create(doc) {
      const saved = {
        _id: new Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...doc,
      };
      matches.push(saved);
      return saved;
    },
    find({ user }) {
      const rows = matches
        .filter((m) => String(m.user) === String(user))
        .sort((a, b) => b.createdAt - a.createdAt)
        // List endpoint excludes the full job description.
        .map(({ jobDescription: _jd, ...rest }) => rest);
      return { select: () => ({ sort: () => rows }) };
    },
    async findOne({ _id, user }) {
      if (!Types.ObjectId.isValid(_id)) throw castError();
      return (
        matches.find(
          (m) =>
            String(m._id) === String(_id) && String(m.user) === String(user),
        ) || null
      );
    },
  };

  // --- Skip real DB connection ---
  const dbPath = require.resolve("./src/config/database");
  require(dbPath);
  require.cache[dbPath].exports = async () => {};
}

async function main() {
  installFakes();
  const app = require("./src/app");
  const agent = request.agent(app);
  const results = [];
  const check = (name, cond, extra = "") => {
    results.push([cond ? "PASS" : "FAIL", name, extra]);
    if (!cond) process.exitCode = 1;
  };

  // ============ Unit: deterministic matcher (no HTTP, no fakes) ============
  const good = matchResumeToJob(GOOD_RESUME, JOB_TITLE, JD);
  check(
    "matcher: good resume scores >= 60",
    good.score >= 60,
    `got ${good.score}`,
  );
  check(
    "matcher: breakdown has 4 components",
    good.breakdown.length === 4,
    `got ${good.breakdown.length}`,
  );
  check(
    "matcher: matched skills detected (Node.js)",
    good.matchedSkills.includes("Node.js"),
    `matched=${good.matchedSkills.slice(0, 6).join(",")}`,
  );
  check(
    "matcher: missing skills detected (Kubernetes)",
    good.missingSkills.includes("Kubernetes"),
    `missing=${good.missingSkills.slice(0, 6).join(",")}`,
  );
  const applicable = good.breakdown.filter((b) => !b.skipped);
  const earned = applicable.reduce((s, b) => s + b.score, 0);
  const max = applicable.reduce((s, b) => s + b.maxScore, 0);
  check(
    "matcher: score equals earned/applicable ratio",
    good.score === Math.round((earned / max) * 100),
    `score=${good.score} earned=${earned} max=${max}`,
  );
  check(
    "matcher: no component exceeds its max",
    good.breakdown.every((b) => b.score <= b.maxScore),
    "overflow!",
  );

  const weak = matchResumeToJob(WEAK_RESUME, JOB_TITLE, JD);
  check(
    "matcher: weak resume scores < 40",
    weak.score < 40,
    `got ${weak.score}`,
  );

  const noYears = matchResumeToJob(
    GOOD_RESUME,
    JOB_TITLE,
    "We need a backend developer. Required: Node.js, Express.",
  );
  const exp = noYears.breakdown.find((b) => b.key === "experience");
  check(
    "matcher: experience component skipped without years requirement",
    exp && exp.skipped === true,
  );

  const empty = matchResumeToJob("", JOB_TITLE, JD);
  check(
    "matcher: empty resume scores 0",
    empty.score === 0,
    `got ${empty.score}`,
  );

  // Whole-word safety: "Java" must not match inside "JavaScript".
  const javaOnly = matchResumeToJob(
    "JavaScript developer with React experience.",
    "Frontend Developer",
    "Required: Java, Spring Boot.",
  );
  check(
    "matcher: 'Java' not matched inside 'JavaScript'",
    !javaOnly.matchedSkills.includes("Java"),
    `matched=${javaOnly.matchedSkills.join(",")}`,
  );

  // ============ HTTP: auth + validation ============
  await agent.post("/api/auth/register").send({
    username: "matchuser",
    email: "match@test.dev",
    password: "password123",
  });

  let res = await request(app)
    .post("/api/matches")
    .send({ jobTitle: JOB_TITLE, jobDescription: JD });
  check(
    "create match anonymous -> 401",
    res.status === 401,
    `got ${res.status}`,
  );

  res = await agent.post("/api/matches").send({ jobDescription: JD });
  check(
    "create match missing title -> 400",
    res.status === 400,
    `got ${res.status}`,
  );

  res = await agent
    .post("/api/matches")
    .send({ jobTitle: JOB_TITLE, jobDescription: "too short" });
  check(
    "create match short JD -> 400",
    res.status === 400,
    `got ${res.status}`,
  );

  res = await agent
    .post("/api/matches")
    .send({ jobTitle: JOB_TITLE, jobDescription: JD });
  check(
    "create match with no resumes -> 404",
    res.status === 404,
    `got ${res.status}`,
  );

  // ============ HTTP: happy paths ============
  res = await agent
    .post("/api/resumes")
    .send({ name: "Backend resume", resumeText: GOOD_RESUME });
  check("create resume -> 201", res.status === 201, `got ${res.status}`);
  const resumeId = res.body.resume?._id;

  res = await agent
    .post("/api/matches")
    .send({ jobTitle: JOB_TITLE, jobDescription: JD });
  check(
    "create match (primary resume default) -> 201",
    res.status === 201,
    `got ${res.status}`,
  );
  const match = res.body.match || {};
  const matchId = match._id;
  check(
    "match has score 0-100",
    typeof match.matchScore === "number" &&
      match.matchScore >= 0 &&
      match.matchScore <= 100,
    `score=${match.matchScore}`,
  );
  check(
    "match breakdown is explainable (4 components)",
    Array.isArray(match.breakdown) &&
      match.breakdown.length === 4 &&
      match.breakdown.every((b) => b.label && typeof b.score === "number"),
    `id=${matchId}`,
  );
  check(
    "match exposes matched/missing skills",
    Array.isArray(match.matchedSkills) &&
      match.matchedSkills.includes("Node.js") &&
      Array.isArray(match.missingSkills) &&
      match.missingSkills.includes("Kubernetes"),
  );
  check(
    "match has AI feedback (stubbed)",
    match.summary === fakeFeedback.summary &&
      match.strengths?.length === 2 &&
      match.gaps?.[0]?.severity === "medium" &&
      match.recommendations?.length === 2,
    "feedback shape mismatch",
  );

  res = await agent
    .post("/api/matches")
    .send({ resumeId, jobTitle: "Frontend Developer", jobDescription: JD });
  check(
    "create match with explicit resumeId -> 201",
    res.status === 201 && res.body.match?.resumeName === "Backend resume",
    `got ${res.status}`,
  );

  res = await agent.post("/api/matches").send({
    resumeId: "000000000000000000000000",
    jobTitle: JOB_TITLE,
    jobDescription: JD,
  });
  check(
    "create match with unknown resumeId -> 404",
    res.status === 404,
    `got ${res.status}`,
  );

  // ============ HTTP: history + ownership ============
  res = await agent.get("/api/matches");
  check(
    "list matches -> 200 with 2 items, JD excluded",
    res.status === 200 &&
      res.body.matches?.length === 2 &&
      res.body.matches.every((m) => !("jobDescription" in m)),
    `got ${res.status} count=${res.body.matches?.length}`,
  );

  res = await agent.get(`/api/matches/${matchId}`);
  check(
    "get match by id -> 200 with JD",
    res.status === 200 &&
      res.body.match?._id === matchId &&
      typeof res.body.match?.jobDescription === "string",
    `got ${res.status}`,
  );

  res = await agent.get("/api/matches/000000000000000000000000");
  check("get missing match -> 404", res.status === 404, `got ${res.status}`);

  res = await agent.get("/api/matches/not-a-valid-id");
  check("get malformed id -> 400", res.status === 400, `got ${res.status}`);

  const agentB = request.agent(app);
  await agentB.post("/api/auth/register").send({
    username: "intruder",
    email: "intruder3@test.dev",
    password: "password123",
  });
  res = await agentB.get(`/api/matches/${matchId}`);
  check(
    "other user reads match -> 404 (IDOR safe)",
    res.status === 404,
    `got ${res.status}`,
  );

  res = await request(app).get(`/api/matches/${matchId}`);
  check(
    "anonymous reads match -> 401",
    res.status === 401,
    `got ${res.status}`,
  );

  for (const [s, n, e] of results)
    console.log(`${s}  ${n}${e ? "  (" + e + ")" : ""}`);

  const failed = results.filter(([s]) => s === "FAIL").length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(process.exitCode || 0);
}

main().catch((e) => {
  console.error("SMOKE TEST CRASH:", e);
  process.exit(1);
});
