/* AI resilience verification: exercises the REAL generateStructured path
 * (timeout + retry + typed errors) with a dummy API key and a short
 * timeout. No valid Gemini credentials are needed — every outcome (fast
 * network error, timeout, or 4xx rejection) must surface as a bounded
 * AiServiceError, never a hang. Run: node smoke.ai-resilience.js */

// Test credentials: real values come from the environment (CI secrets).
// Otherwise fall back to generated non-secret placeholders so the suite
// runs with zero config. Never commit real credentials here.
const crypto = require("crypto");
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
}
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = "smoke-test-placeholder-not-a-real-key";
}
process.env.MONGO_URI = "mongodb://localhost:27017/smoke";
// Force the minimum timeout so this test stays fast regardless of
// network conditions (the production clamp floors at 5000ms).
process.env.AI_TIMEOUT_MS = "5000";
process.env.AI_MAX_RETRIES = "1";

const {
  generateInterviewReport,
  AiServiceError,
  isTransientError,
} = require("./src/services/ai.service");
const config = require("./src/utils/env");

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

async function run() {
  // 1. Config wiring.
  check(
    "AI timeout is bounded (5000ms floor in test)",
    config.aiTimeoutMs === 5000,
    `(got ${config.aiTimeoutMs})`,
  );
  check(
    "AI retries capped at 1",
    config.aiMaxRetries === 1,
    `(got ${config.aiMaxRetries})`,
  );
  check(
    "model name is env-overridable",
    typeof config.geminiModel === "string" && config.geminiModel.length > 0,
    `(got ${config.geminiModel})`,
  );

  // 2. Transient-error classification (the retry decision core).
  check("429 is transient", isTransientError({ status: 429 }) === true);
  check("503 is transient", isTransientError({ status: 503 }) === true);
  check("500 is transient", isTransientError({ status: 500 }) === true);
  check("400 is NOT transient", isTransientError({ status: 400 }) === false);
  check("401 is NOT transient", isTransientError({ status: 401 }) === false);
  check(
    "timeout code is transient",
    isTransientError({ code: "AI_TIMEOUT" }) === true,
  );
  check(
    "AbortError is transient",
    isTransientError({ name: "AbortError" }) === true,
  );
  check(
    "ENOTFOUND is transient",
    isTransientError({ message: "getaddrinfo ENOTFOUND x" }) === true,
  );
  check("null is not transient", isTransientError(null) === false);

  // 3. End-to-end through the real SDK path with a dummy key: must fail
  // fast with a typed error, never hang. (With a 100ms timeout the call
  // either times out, fails fast on network, or gets a fast 4xx — all
  // must surface as AiServiceError within seconds.)
  const start = Date.now();
  let thrown = null;
  try {
    await generateInterviewReport({
      resume: "Jane Doe, software engineer",
      selfDescription: "",
      jobDescription: "Backend engineer needed. ".repeat(20),
    });
  } catch (error) {
    thrown = error;
  }
  const elapsed = Date.now() - start;

  check(
    "real AI call failure throws AiServiceError",
    thrown instanceof AiServiceError,
    `(got ${thrown?.name})`,
  );
  check(
    "failure is bounded in time (< 15s incl. retry backoff)",
    elapsed < 15000,
    `(${elapsed}ms)`,
  );
  check(
    "error message explains the failure",
    typeof thrown?.message === "string" &&
      /AI request failed/i.test(thrown.message),
  );

  console.log(`\n${passed}/${passed + failed} checks passed`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error("Smoke test crashed:", error);
  process.exit(1);
});
