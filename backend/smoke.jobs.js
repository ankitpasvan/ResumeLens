/* Jobs + application tracking smoke test: exercises the real HTTP stack
 * (routes, middleware, controllers) for job postings, saved jobs and the
 * application pipeline with in-memory model fakes. */
const testEnv = {
  JWT_SECRET: "jobs-smoke-test-signing-value",
  GEMINI_API_KEY: "not-needed-for-jobs",
};
for (const [name, value] of Object.entries(testEnv)) {
  if (!process.env[name]) process.env[name] = value;
}
process.env.MONGO_URI = "mongodb://localhost:27017/smoke";

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { Types } = require("mongoose");

function installFakes() {
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

  // Generic in-memory collection supporting the query shapes used by the
  // job controller: create, find, findOne (plain values + RegExp), deleteOne,
  // countDocuments, and doc.save().
  function makeCollection() {
    const rows = [];

    function matchesFilter(doc, filter = {}) {
      return Object.entries(filter).every(([key, value]) => {
        const field = doc[key];
        if (value instanceof RegExp) return value.test(field || "");
        return String(field) === String(value);
      });
    }

    function toDoc(raw) {
      const doc = {
        ...raw,
        _id: raw._id || new Types.ObjectId(),
        createdAt: raw.createdAt || new Date(),
        async save() {
          const idx = rows.findIndex((r) => String(r._id) === String(doc._id));
          const plain = { ...doc };
          delete plain.save;
          delete plain.toObject;
          if (idx >= 0) rows[idx] = { ...plain };
          return doc;
        },
        toObject() {
          const { save: _s, toObject: _t, ...rest } = doc;
          return rest;
        },
      };
      return doc;
    }

    return {
      async create(payload) {
        const doc = toDoc(payload);
        const { save: _s, toObject: _t, ...plain } = doc;
        rows.push({ ...plain });
        return doc;
      },
      async find(filter = {}) {
        return rows
          .filter((r) => matchesFilter(r, filter))
          .map((r) => toDoc({ ...r }));
      },
      async findOne(filter = {}) {
        const found = rows.find((r) => matchesFilter(r, filter));
        return found ? toDoc({ ...found }) : null;
      },
      async deleteOne(filter = {}) {
        const idx = rows.findIndex((r) => matchesFilter(r, filter));
        if (idx >= 0) {
          rows.splice(idx, 1);
          return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
      },
      async countDocuments(filter = {}) {
        return rows.filter((r) => matchesFilter(r, filter)).length;
      },
    };
  }

  const jobPath = require.resolve("./src/models/job.model");
  require(jobPath);
  require.cache[jobPath].exports = makeCollection();

  const savedJobPath = require.resolve("./src/models/savedJob.model");
  require(savedJobPath);
  require.cache[savedJobPath].exports = makeCollection();

  const applicationPath = require.resolve("./src/models/jobApplication.model");
  require(applicationPath);
  const applicationCollection = makeCollection();
  applicationCollection.APPLICATION_STATUSES = [
    "saved",
    "applied",
    "assessment",
    "interview",
    "offer",
    "rejected",
  ];
  require.cache[applicationPath].exports = applicationCollection;
}

installFakes();

const app = require("./src/app");

let passed = 0;
let failed = 0;

function check(name, condition, extra = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}  ${extra}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${name}  ${extra}`);
  }
}

async function registerAndLogin(agent, username, email) {
  await agent.post("/api/auth/register").send({
    username,
    email,
    password: "password123",
  });
  await agent.post("/api/auth/login").send({ email, password: "password123" });
}

const JOB_A = {
  title: "Senior Frontend Developer",
  company: "Acme Corp",
  location: "Bengaluru, India",
  jobType: "full-time",
  workMode: "hybrid",
  description:
    "We are hiring a senior frontend developer with 4+ years of experience building React applications at scale.",
  requirements: ["4+ years React", "TypeScript", "design systems"],
  skills: ["React", "TypeScript", "CSS"],
  salaryMin: 1800000,
  salaryMax: 2500000,
};

async function run() {
  // 1. Auth gate.
  let res = await request(app).get("/api/jobs");
  check(
    "anonymous lists jobs -> 401",
    res.status === 401,
    `(got ${res.status})`,
  );

  const agentA = request.agent(app);
  await registerAndLogin(agentA, "alice", "alice@example.com");

  // 2. Validation.
  res = await agentA.post("/api/jobs").send({ company: "Acme" });
  check(
    "create job without title -> 400",
    res.status === 400 && /title/i.test(res.body.error || ""),
    `(got ${res.status})`,
  );

  res = await agentA.post("/api/jobs").send({ ...JOB_A, jobType: "weird" });
  check(
    "create job with invalid jobType -> 400",
    res.status === 400,
    `(got ${res.status})`,
  );

  // 3. Create an open job and a draft.
  res = await agentA.post("/api/jobs").send(JOB_A);
  check(
    "create job -> 201",
    res.status === 201 && res.body.job?._id,
    `(got ${res.status})`,
  );
  const jobId = res.body.job?._id;

  res = await agentA
    .post("/api/jobs")
    .send({ ...JOB_A, title: "Secret Draft Role", status: "draft" });
  check("create draft job -> 201", res.status === 201, `(got ${res.status})`);
  const draftId = res.body.job?._id;

  // 4. Listing, search, filters.
  res = await agentA.get("/api/jobs");
  check(
    "owner lists jobs -> sees open + draft",
    res.status === 200 && res.body.jobs?.length === 2,
    `(got ${res.status}, ${res.body.jobs?.length})`,
  );

  res = await agentA.get("/api/jobs?q=frontend");
  check(
    "search ?q=frontend matches",
    res.status === 200 && res.body.jobs?.length === 2,
    `(got ${res.body.jobs?.length})`,
  );

  res = await agentA.get("/api/jobs?q=quantum");
  check(
    "search ?q=quantum matches nothing",
    res.status === 200 && res.body.jobs?.length === 0,
    `(got ${res.body.jobs?.length})`,
  );

  // 5. Detail view (owner gets applicant count).
  res = await agentA.get(`/api/jobs/${jobId}`);
  check(
    "owner gets job detail with applicants",
    res.status === 200 &&
      res.body.job?.isMine === true &&
      typeof res.body.job?.applicants === "number",
    `(got ${res.status})`,
  );

  // 6. Owner update.
  res = await agentA
    .patch(`/api/jobs/${jobId}`)
    .send({ ...JOB_A, title: "Lead Frontend Developer" });
  check(
    "owner updates job -> 200",
    res.status === 200 && res.body.job?.title === "Lead Frontend Developer",
    `(got ${res.status})`,
  );

  // 7. Second user: isolation.
  const agentB = request.agent(app);
  await registerAndLogin(agentB, "bob", "bob@example.com");

  res = await agentB
    .patch(`/api/jobs/${jobId}`)
    .send({ ...JOB_A, title: "Hacked" });
  check(
    "other user updates job -> 404",
    res.status === 404,
    `(got ${res.status})`,
  );

  res = await agentB.get("/api/jobs");
  check(
    "other user sees only open jobs",
    res.status === 200 &&
      res.body.jobs?.length === 1 &&
      res.body.jobs?.every((j) => j.isMine !== true),
    `(got ${res.body.jobs?.length})`,
  );

  // 8. Saved jobs.
  res = await agentB.post("/api/saved-jobs").send({ jobId });
  check(
    "save job by id -> 201",
    res.status === 201 && res.body.savedJob?._id,
    `(got ${res.status})`,
  );
  const savedId = res.body.savedJob?._id;

  res = await agentB.post("/api/saved-jobs").send({ jobId });
  check("duplicate save -> 409", res.status === 409, `(got ${res.status})`);

  res = await agentB.post("/api/saved-jobs").send({
    jobTitle: "Data Analyst",
    company: "Globex",
    description: "Analyze dashboards and build reports.",
  });
  check("save ad-hoc job -> 201", res.status === 201, `(got ${res.status})`);

  res = await agentB.post("/api/saved-jobs").send({
    jobTitle: "data analyst",
    company: "GLOBEX",
  });
  check(
    "duplicate ad-hoc save (case-insensitive) -> 409",
    res.status === 409,
    `(got ${res.status})`,
  );

  res = await agentB.get("/api/saved-jobs");
  check(
    "list saved jobs -> 2",
    res.status === 200 && res.body.savedJobs?.length === 2,
    `(got ${res.body.savedJobs?.length})`,
  );

  // 9. Applications.
  res = await agentB
    .post("/api/applications")
    .send({ savedJobId: savedId, status: "applied", matchScore: 82 });
  check(
    "create application from saved job -> 201",
    res.status === 201 &&
      res.body.application?.status === "applied" &&
      res.body.application?.matchScore === 82 &&
      res.body.application?.statusHistory?.length === 1,
    `(got ${res.status})`,
  );
  const applicationId = res.body.application?._id;

  res = await agentB
    .patch(`/api/applications/${applicationId}`)
    .send({ status: "interview", note: "First round scheduled" });
  check(
    "move status to interview -> history recorded",
    res.status === 200 &&
      res.body.application?.status === "interview" &&
      res.body.application?.statusHistory?.length === 2,
    `(got ${res.status})`,
  );

  res = await agentB
    .patch(`/api/applications/${applicationId}`)
    .send({ status: "hired" });
  check("invalid status -> 400", res.status === 400, `(got ${res.status})`);

  res = await agentA.get("/api/applications");
  check(
    "other user lists applications -> sees none",
    res.status === 200 && res.body.applications?.length === 0,
    `(got ${res.body.applications?.length})`,
  );

  res = await agentA
    .patch(`/api/applications/${applicationId}`)
    .send({ status: "rejected" });
  check(
    "other user moves application -> 404",
    res.status === 404,
    `(got ${res.status})`,
  );

  res = await agentB.put(`/api/applications/${applicationId}`).send({
    notes: "Prepare system design stories.",
    nextStep: "Technical round",
    nextStepDate: "2026-10-05",
  });
  check(
    "update notes/next step -> 200",
    res.status === 200 &&
      res.body.application?.notes === "Prepare system design stories." &&
      res.body.application?.nextStep === "Technical round",
    `(got ${res.status})`,
  );

  res = await agentB.get("/api/applications?status=interview");
  check(
    "filter applications by status -> 1",
    res.status === 200 && res.body.applications?.length === 1,
    `(got ${res.body.applications?.length})`,
  );

  // 10. Cleanup.
  res = await agentB.delete(`/api/saved-jobs/${savedId}`);
  check("delete saved job -> 204", res.status === 204, `(got ${res.status})`);

  res = await agentB.delete(`/api/applications/${applicationId}`);
  check("delete application -> 204", res.status === 204, `(got ${res.status})`);

  res = await agentB.delete(`/api/jobs/${jobId}`);
  check(
    "non-owner deletes job -> 404",
    res.status === 404,
    `(got ${res.status})`,
  );

  res = await agentA.delete(`/api/jobs/${jobId}`);
  check("owner deletes job -> 204", res.status === 204, `(got ${res.status})`);

  res = await agentA.delete(`/api/jobs/${draftId}`);
  check(
    "owner deletes draft -> 204",
    res.status === 204,
    `(got ${res.status})`,
  );

  console.log(`\n${passed}/${passed + failed} checks passed`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error("Smoke test crashed:", error);
  process.exit(1);
});
