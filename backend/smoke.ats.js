/* ATS smoke test: exercises the real HTTP stack (routes, middleware,
 * controllers) for the ATS analyzer with in-memory model fakes and a
 * stubbed Gemini feedback call. Also unit-tests the deterministic scorer
 * directly (pure function, no fakes needed). */
process.env.JWT_SECRET = "smoke-test-secret";
process.env.GEMINI_API_KEY = "smoke-test-key";
process.env.MONGO_URI = "mongodb://localhost:27017/smoke";

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { Types } = require("mongoose");

// Pure function: safe to require without any fakes.
const { analyzeAts } = require("./src/services/ats.service");

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
- Designed authentication service with JWT, achieving 99.9% uptime

Backend Developer - BetaSoft (2020-2022)
- Built real-time notification service handling 10k concurrent users
- Automated test suite with Jest, reducing regression bugs by 35%
- Deployed services on AWS EC2 with Docker containers

EDUCATION
B.Tech Computer Science - XYZ University (2016-2020)

TECHNICAL SKILLS
Node.js, Express, MongoDB, Redis, Docker, AWS, TypeScript, JavaScript, REST APIs, Jest

PROJECTS
Analytics dashboard - Built a real-time dashboard processing 500k events daily.
Open-source CLI - Created a CLI tool with 2k GitHub stars.
`;

const WEAK_RESUME = `
Hi I am Rahul.
I know computers. I did some work on websites.
Contact me sometime.
`;

const JD = `
Backend Developer (Node.js)

We are looking for a backend developer with 3+ years of experience building
APIs with Node.js and Express. You will design RESTful services, work with
MongoDB and Redis, and deploy with Docker on AWS.

Required: Node.js, Express, MongoDB, RESTful APIs, Docker, AWS, Redis,
microservices, CI/CD, TypeScript, Kubernetes, GraphQL, system design,
testing, Jest.
`;

const fakeFeedback = {
  summary:
    "Strong backend resume with measurable impact and good keyword coverage.",
  strengths: [
    "Clear work experience section with quantified achievements.",
    "Good keyword overlap with the job description.",
  ],
  weaknesses: [
    {
      issue: "No certifications section",
      severity: "low",
      suggestion: "Add relevant certifications if you have any.",
    },
    {
      issue: "Missing Kubernetes keyword",
      severity: "medium",
      suggestion: "Mention Kubernetes exposure in projects if applicable.",
    },
  ],
  suggestions: [
    "Add a Kubernetes project to cover the missing keyword.",
    "Add a certifications section.",
  ],
};

function installFakes() {
  // --- Stub Gemini feedback before controllers load ---
  const aiPath = require.resolve("./src/services/ai.service");
  require(aiPath);
  require.cache[aiPath].exports.generateAtsFeedback = async () =>
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

  // --- In-memory AtsAnalysis model fake (mimics CastError like mongoose) ---
  const analyses = [];
  const atsPath = require.resolve("./src/models/atsAnalysis.model");
  require(atsPath);
  const castError = () => {
    const e = new Error("Cast to ObjectId failed");
    e.name = "CastError";
    return e;
  };
  require.cache[atsPath].exports = {
    async create(doc) {
      const saved = {
        _id: new Types.ObjectId(),
        createdAt: new Date(),
        ...doc,
      };
      analyses.push(saved);
      return saved;
    },
    async findOne({ _id, user }) {
      if (!Types.ObjectId.isValid(_id)) throw castError();
      return (
        analyses.find(
          (a) =>
            String(a._id) === String(_id) && String(a.user) === String(user),
        ) || null
      );
    },
    find({ user }) {
      const rows = analyses
        .filter((a) => String(a.user) === String(user))
        .sort((a, b) => b.createdAt - a.createdAt);
      return { sort: () => rows };
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

  // ============ Unit: deterministic scorer (no HTTP, no fakes) ============
  const good = analyzeAts(GOOD_RESUME, JD);
  check(
    "scorer: good resume scores >= 70",
    good.score >= 70,
    `got ${good.score}`,
  );
  check(
    "scorer: breakdown has 7 components",
    good.breakdown.length === 7,
    `got ${good.breakdown.length}`,
  );
  check(
    "scorer: missing keywords detected (kubernetes)",
    good.missingKeywords.includes("kubernetes"),
    `missing=${good.missingKeywords.slice(0, 5).join(",")}`,
  );
  const applicable = good.breakdown.filter((b) => !b.skipped);
  const earned = applicable.reduce((s, b) => s + b.score, 0);
  const max = applicable.reduce((s, b) => s + b.maxScore, 0);
  check(
    "scorer: score equals earned/applicable ratio",
    good.score === Math.round((earned / max) * 100),
    `score=${good.score} earned=${earned} max=${max}`,
  );
  check(
    "scorer: no component exceeds its max",
    good.breakdown.every((b) => b.score <= b.maxScore),
    "overflow!",
  );

  const weak = analyzeAts(WEAK_RESUME, JD);
  check(
    "scorer: weak resume scores < 50",
    weak.score < 50,
    `got ${weak.score}`,
  );

  const noJd = analyzeAts(GOOD_RESUME, "");
  const kw = noJd.breakdown.find((b) => b.key === "keywords");
  check(
    "scorer: keyword component skipped without JD",
    kw && kw.skipped === true,
  );
  check(
    "scorer: score still valid without JD",
    noJd.score >= 0 && noJd.score <= 100,
    `got ${noJd.score}`,
  );

  const empty = analyzeAts("", "");
  check(
    "scorer: empty resume scores 0",
    empty.score === 0,
    `got ${empty.score}`,
  );

  // ============ HTTP: auth + validation ============
  await agent
    .post("/api/auth/register")
    .send({
      username: "atsuser",
      email: "ats@test.dev",
      password: "password123",
    });

  let res = await request(app)
    .post("/api/ats/analyze")
    .field("jobDescription", JD);
  check("analyze anonymous -> 401", res.status === 401, `got ${res.status}`);

  res = await agent.post("/api/ats/analyze").field("jobDescription", JD);
  check(
    "analyze with no resume -> 400",
    res.status === 400,
    `got ${res.status}`,
  );

  res = await agent
    .post("/api/ats/analyze")
    .field("jobDescription", JD)
    .attach("resume", Buffer.from("not a pdf"), {
      filename: "resume.txt",
      contentType: "text/plain",
    });
  check(
    "analyze non-PDF upload -> 400",
    res.status === 400,
    `got ${res.status}`,
  );

  // ============ HTTP: happy paths ============
  res = await agent
    .post("/api/ats/analyze")
    .field("resumeText", GOOD_RESUME)
    .field("jobDescription", JD);
  check("analyze with JD -> 201", res.status === 201, `got ${res.status}`);
  const analysis = res.body.analysis || {};
  const analysisId = analysis._id;
  check(
    "analysis has score 0-100",
    typeof analysis.score === "number" &&
      analysis.score >= 0 &&
      analysis.score <= 100,
    `score=${analysis.score}`,
  );
  check(
    "analysis breakdown is explainable",
    Array.isArray(analysis.breakdown) &&
      analysis.breakdown.length === 7 &&
      analysis.breakdown.every((b) => b.label && typeof b.score === "number"),
    `id=${analysisId}`,
  );
  check(
    "analysis exposes missing keywords",
    Array.isArray(analysis.missingKeywords) &&
      analysis.missingKeywords.includes("kubernetes"),
  );
  check(
    "analysis has AI feedback (stubbed)",
    analysis.summary === fakeFeedback.summary &&
      analysis.strengths?.length === 2 &&
      analysis.weaknesses?.[1]?.severity === "medium" &&
      analysis.suggestions?.length === 2,
    "feedback shape mismatch",
  );

  res = await agent.post("/api/ats/analyze").field("resumeText", GOOD_RESUME);
  check("analyze without JD -> 201", res.status === 201, `got ${res.status}`);
  const noJdAnalysis = res.body.analysis || {};
  check(
    "keyword component skipped without JD (HTTP)",
    noJdAnalysis.breakdown?.find((b) => b.key === "keywords")?.skipped === true,
  );

  // ============ HTTP: history + ownership ============
  res = await agent.get("/api/ats");
  check(
    "list analyses -> 200 with 2 items",
    res.status === 200 && res.body.analyses?.length === 2,
    `got ${res.status} count=${res.body.analyses?.length}`,
  );

  res = await agent.get(`/api/ats/${analysisId}`);
  check(
    "get analysis by id -> 200",
    res.status === 200 && res.body.analysis?._id === analysisId,
    `got ${res.status}`,
  );

  res = await agent.get("/api/ats/000000000000000000000000");
  check("get missing analysis -> 404", res.status === 404, `got ${res.status}`);

  res = await agent.get("/api/ats/not-a-valid-id");
  check("get malformed id -> 400", res.status === 400, `got ${res.status}`);

  const agentB = request.agent(app);
  await agentB
    .post("/api/auth/register")
    .send({
      username: "intruder",
      email: "intruder2@test.dev",
      password: "password123",
    });
  res = await agentB.get(`/api/ats/${analysisId}`);
  check(
    "other user reads analysis -> 404 (IDOR safe)",
    res.status === 404,
    `got ${res.status}`,
  );

  res = await request(app).get(`/api/ats/${analysisId}`);
  check(
    "anonymous reads analysis -> 401",
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
