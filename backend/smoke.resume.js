/* Resume smoke test: exercises the real HTTP stack (routes, middleware,
 * controllers) for the Resume Vault with in-memory model fakes.
 * Run: node smoke.resume.js  (from backend/) */
process.env.JWT_SECRET = "smoke-test-secret";
process.env.GEMINI_API_KEY = "smoke-test-key";
process.env.MONGO_URI = "mongodb://localhost:27017/smoke";

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { Types } = require("mongoose");

const GOOD_RESUME = `
John Doe
john.doe@email.com | +91 98765 43210

PROFESSIONAL SUMMARY
Backend developer with 4 years of experience building scalable Node.js APIs.

WORK EXPERIENCE
Senior Backend Developer - Acme Corp (2022-Present)
- Developed RESTful APIs using Node.js and Express serving 2M requests/day
- Improved API response time by 40% with MongoDB optimization

TECHNICAL SKILLS
Node.js, Express, MongoDB, Redis, Docker, AWS, TypeScript
`;

let passed = 0;
let failed = 0;
function check(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`ok   - ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL - ${name}${detail ? ` (${detail})` : ""}`);
  }
}

function installFakes() {
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

  const resumes = [];
  const resumePath = require.resolve("./src/models/resume.model");
  require(resumePath);
  const castError = () => {
    const e = new Error("Cast to ObjectId failed");
    e.name = "CastError";
    return e;
  };
  const matches = (doc, filter) =>
    Object.entries(filter).every(
      ([key, value]) => String(doc[key]) === String(value),
    );
  const chainable = (row) => ({
    sort: async () => row,
    then(resolve) {
      resolve(row);
    },
  });
  const attachSave = (doc) => {
    doc.save = async () => doc;
    return doc;
  };
  require.cache[resumePath].exports = {
    async create(doc) {
      const saved = attachSave({
        _id: new Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...doc,
      });
      resumes.push(saved);
      return saved;
    },
    async countDocuments(filter) {
      return resumes.filter((r) => matches(r, filter)).length;
    },
    find(filter) {
      const rows = resumes
        .filter((r) => matches(r, filter))
        .map((r) => {
          const { parsedText: _t, ...rest } = r;
          return rest;
        })
        .sort((a, b) => b.createdAt - a.createdAt);
      return { select: () => ({ sort: async () => rows }) };
    },
    findOne(filter) {
      if (filter._id && !Types.ObjectId.isValid(filter._id)) throw castError();
      const row = resumes.find((r) => matches(r, filter)) || null;
      return chainable(row ? attachSave(row) : null);
    },
    async updateMany(filter, update) {
      let modified = 0;
      for (const r of resumes) {
        if (matches(r, filter)) {
          Object.assign(r, update.$set || {});
          modified += 1;
        }
      }
      return { modifiedCount: modified };
    },
    async findOneAndDelete(filter) {
      if (filter._id && !Types.ObjectId.isValid(filter._id)) throw castError();
      const idx = resumes.findIndex((r) => matches(r, filter));
      if (idx === -1) return null;
      return resumes.splice(idx, 1)[0];
    },
  };

  const dbPath = require.resolve("./src/config/database");
  require(dbPath);
  require.cache[dbPath].exports = async () => {};
}

async function registerAndLogin(agent, username, email) {
  await agent
    .post("/api/auth/register")
    .send({ username, email, password: "password123" });
  const res = await agent
    .post("/api/auth/login")
    .send({ email, password: "password123" });
  return res.status === 200;
}

async function main() {
  installFakes();
  const app = require("./src/app");

  let res = await request(app).get("/api/resumes");
  check("unauthenticated list -> 401", res.status === 401, `got ${res.status}`);

  res = await request(app).post("/api/resumes").send({ name: "x" });
  check(
    "unauthenticated create -> 401",
    res.status === 401,
    `got ${res.status}`,
  );

  const agent = request.agent(app);
  check(
    "register+login works",
    await registerAndLogin(agent, "tester", "t@e.com"),
  );

  res = await agent
    .post("/api/resumes")
    .send({ name: "Backend resume", resumeText: GOOD_RESUME });
  check("create from text -> 201", res.status === 201, `got ${res.status}`);
  const firstId = res.body.resume?._id;
  check("first resume is primary", res.body.resume?.isPrimary === true);

  res = await agent.post("/api/resumes").send({ name: "Empty" });
  check("missing text -> 400", res.status === 400, `got ${res.status}`);

  res = await agent
    .post("/api/resumes")
    .send({ name: "x", resumeText: "a".repeat(60001) });
  check("oversize text -> 400", res.status === 400, `got ${res.status}`);

  res = await agent.post("/api/resumes/upload").field("name", "No file");
  check("upload without file -> 400", res.status === 400, `got ${res.status}`);

  res = await agent
    .post("/api/resumes")
    .send({ name: "Second resume", resumeText: GOOD_RESUME });
  check("second create -> 201", res.status === 201, `got ${res.status}`);
  const secondId = res.body.resume?._id;
  check("second resume is not primary", res.body.resume?.isPrimary === false);

  res = await agent.get("/api/resumes");
  check(
    "list -> 200 with 2 resumes",
    res.status === 200 && res.body.resumes?.length === 2,
    `got ${res.status}/${res.body.resumes?.length}`,
  );
  check(
    "list excludes parsedText",
    res.body.resumes?.every((r) => !("parsedText" in r)),
  );
  check(
    "list newest first",
    String(res.body.resumes?.[0]._id) === String(secondId),
  );

  res = await agent.get(`/api/resumes/${firstId}`);
  check(
    "get one -> 200 with parsedText",
    res.status === 200 && typeof res.body.resume?.parsedText === "string",
    `got ${res.status}`,
  );

  res = await agent.get("/api/resumes/primary");
  check(
    "primary returns first resume",
    res.status === 200 && String(res.body.resume?._id) === String(firstId),
    `got ${res.status}`,
  );

  res = await agent.patch(`/api/resumes/${secondId}/primary`);
  check("set primary -> 200", res.status === 200, `got ${res.status}`);
  res = await agent.get("/api/resumes/primary");
  check(
    "primary switched to second",
    String(res.body.resume?._id) === String(secondId),
  );

  const agentB = request.agent(app);
  check(
    "second user register+login",
    await registerAndLogin(agentB, "other", "o@e.com"),
  );
  res = await agentB.get(`/api/resumes/${firstId}`);
  check(
    "other user cannot read resume -> 404",
    res.status === 404,
    `got ${res.status}`,
  );
  res = await agentB.delete(`/api/resumes/${firstId}`);
  check(
    "other user cannot delete resume -> 404",
    res.status === 404,
    `got ${res.status}`,
  );
  res = await agentB.get("/api/resumes");
  check("other user sees empty list", res.body.resumes?.length === 0);

  res = await agent.get("/api/resumes/not-a-valid-id");
  check("malformed id -> 400", res.status === 400, `got ${res.status}`);
  res = await agent.get("/api/resumes/000000000000000000000000");
  check("unknown id -> 404", res.status === 404, `got ${res.status}`);
  res = await agent.patch("/api/resumes/000000000000000000000000/primary");
  check(
    "set primary unknown id -> 404",
    res.status === 404,
    `got ${res.status}`,
  );

  res = await agent.delete(`/api/resumes/${secondId}`);
  check("delete primary -> 200", res.status === 200, `got ${res.status}`);
  res = await agent.get("/api/resumes/primary");
  check(
    "remaining resume promoted to primary",
    res.status === 200 &&
      String(res.body.resume?._id) === String(firstId) &&
      res.body.resume?.isPrimary === true,
    `got ${res.status}`,
  );

  res = await agent.delete(`/api/resumes/${firstId}`);
  check("delete last -> 200", res.status === 200, `got ${res.status}`);
  res = await agent.get("/api/resumes/primary");
  check(
    "primary with no resumes -> 404",
    res.status === 404,
    `got ${res.status}`,
  );

  console.log(`\n${passed}/${passed + failed} checks passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
