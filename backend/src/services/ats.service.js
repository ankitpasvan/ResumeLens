// Deterministic ATS (Applicant Tracking System) scoring.
//
// This module contains NO AI calls on purpose. Every point is awarded by a
// transparent, explainable rule, so the score is reproducible and the API
// response can tell the user exactly which checks passed, which failed, and
// which keywords are missing. The Gemini layer (ai.service.js) only adds
// qualitative feedback (strengths / weaknesses / suggestions) on top of
// these findings.

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "for",
  "with",
  "on",
  "at",
  "by",
  "from",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "will",
  "would",
  "can",
  "could",
  "should",
  "shall",
  "may",
  "might",
  "must",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "not",
  "no",
  "we",
  "you",
  "he",
  "she",
  "they",
  "it",
  "its",
  "our",
  "your",
  "their",
  "this",
  "that",
  "these",
  "those",
  "there",
  "here",
  "per",
  "via",
  "within",
  "between",
  "across",
  "including",
  "include",
  "includes",
  "included",
  "plus",
  "etc",
  "role",
  "job",
  "jobs",
  "candidate",
  "candidates",
  "looking",
  "seeking",
  "seek",
  "join",
  "joined",
  "team",
  "teams",
  "work",
  "working",
  "worked",
  "experience",
  "years",
  "year",
  "ability",
  "strong",
  "excellent",
  "good",
  "great",
  "responsibilities",
  "responsibility",
  "requirements",
  "requirement",
  "required",
  "preferred",
  "bonus",
  "help",
  "helps",
  "using",
  "use",
  "used",
  "uses",
  "based",
  "ensure",
  "ensures",
  "end",
  "day",
  "daily",
]);

const ACTION_VERBS = [
  "achieved",
  "built",
  "created",
  "delivered",
  "designed",
  "developed",
  "drove",
  "engineered",
  "established",
  "executed",
  "expanded",
  "generated",
  "grew",
  "implemented",
  "improved",
  "increased",
  "initiated",
  "launched",
  "led",
  "maintained",
  "managed",
  "mentored",
  "migrated",
  "optimized",
  "orchestrated",
  "owned",
  "pioneered",
  "reduced",
  "refactored",
  "resolved",
  "scaled",
  "shipped",
  "simplified",
  "spearheaded",
  "streamlined",
  "strengthened",
  "transformed",
  "automated",
  "collaborated",
  "debugged",
  "deployed",
  "documented",
  "accelerated",
  "boosted",
  "saved",
  "cut",
];

const SECTION_PATTERNS = [
  {
    key: "summary",
    label: "Summary / Objective",
    pattern: /\b(summary|objective|profile)\b/i,
  },
  {
    key: "experience",
    label: "Work Experience",
    pattern: /\b(experience|employment history|work history)\b/i,
  },
  {
    key: "education",
    label: "Education",
    pattern: /\b(education|academic background)\b/i,
  },
  {
    key: "skills",
    label: "Skills",
    pattern:
      /\b(skills|technical skills|core competencies|tech stack|technologies)\b/i,
  },
  { key: "projects", label: "Projects", pattern: /\bprojects?\b/i },
  {
    key: "certifications",
    label: "Certifications",
    pattern: /\bcertifications?\b/i,
  },
];

// Matches whole words only, so "java" does not match "javascript".
// Allows tech tokens such as node.js, c++ and c#.
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function keywordPresent(text, word) {
  const re = new RegExp(
    `(^|[^a-z0-9+#.])${escapeRegExp(word)}([^a-z0-9+#.]|$)`,
    "i",
  );
  return re.test(text);
}

// Pulls the most frequent meaningful terms out of a job description.
// Single words only; frequency = importance.
function extractKeywords(jobDescription, limit = 25) {
  const freq = new Map();
  const tokens = (jobDescription || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/);

  for (const raw of tokens) {
    const token = raw.trim();
    if (token.length < 3 || token.length > 24) continue;
    if (STOPWORDS.has(token)) continue;
    if (/^\d+$/.test(token)) continue;
    freq.set(token, (freq.get(token) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

function scoreContact(resume) {
  const maxScore = 10;
  const details = [];
  let score = 0;

  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(resume)) {
    score += 5;
    details.push("Email address found.");
  } else {
    details.push("No email address found — recruiters cannot contact you.");
  }

  const phoneLike = (resume.match(/\+?[\d\s().-]{9,}/g) || []).find(
    (s) => s.replace(/\D/g, "").length >= 10,
  );
  if (phoneLike) {
    score += 5;
    details.push("Phone number found.");
  } else {
    details.push("No phone number found.");
  }

  return {
    key: "contact",
    label: "Contact Information",
    score,
    maxScore,
    details,
  };
}

function scoreSections(resume) {
  const maxScore = 20;
  const perSection = 4;
  const found = [];
  const missing = [];

  for (const section of SECTION_PATTERNS) {
    if (section.pattern.test(resume)) found.push(section.label);
    else missing.push(section.label);
  }

  const score = Math.min(maxScore, found.length * perSection);
  const details = [];
  if (found.length) details.push(`Found: ${found.join(", ")}.`);
  if (missing.length) details.push(`Missing: ${missing.join(", ")}.`);

  return {
    key: "sections",
    label: "Section Completeness",
    score,
    maxScore,
    details,
  };
}

function scoreLength(wordCount) {
  const maxScore = 10;
  let score;
  let note;

  if (wordCount >= 300 && wordCount <= 900) {
    score = 10;
    note = `${wordCount} words — ideal resume length.`;
  } else if (
    (wordCount >= 150 && wordCount < 300) ||
    (wordCount > 900 && wordCount <= 1500)
  ) {
    score = 6;
    note = `${wordCount} words — slightly outside the ideal 300–900 range.`;
  } else {
    score = 3;
    note = `${wordCount} words — too ${wordCount < 150 ? "short" : "long"}; aim for 300–900 words.`;
  }

  return {
    key: "length",
    label: "Resume Length",
    score,
    maxScore,
    details: [note],
  };
}

function scoreActionVerbs(resume) {
  const maxScore = 10;
  const lower = resume.toLowerCase();
  let hits = 0;
  const examples = [];

  for (const verb of ACTION_VERBS) {
    const matches = lower.match(new RegExp(`\\b${verb}\\b`, "g")) || [];
    if (matches.length > 0) {
      hits += matches.length;
      if (examples.length < 5) examples.push(verb);
    }
  }

  let score;
  if (hits >= 12) score = 10;
  else if (hits >= 8) score = 7;
  else if (hits >= 4) score = 4;
  else score = 1;

  const details = [
    `${hits} strong action verb${hits === 1 ? "" : "s"} found${examples.length ? ` (e.g. ${examples.join(", ")})` : ""}.`,
  ];
  if (score < 10) {
    details.push(
      "Start bullet points with strong verbs like built, led, improved, delivered.",
    );
  }

  return { key: "verbs", label: "Action Verbs", score, maxScore, details };
}

const MEASURABLE_PATTERNS = [
  /\d+\s*%/g, // 40%
  /\$\s?[\d,]+/g, // $50k, $1,000
  /\b\d+\s?(million|billion|thousand|k)\b/gi, // 2 million, 50k
  /\b\d+x\b/gi, // 3x
  /\b\d+\s?(users|customers|clients|requests|ms|seconds|minutes|hours|days|weeks|projects|engineers|teams|servers|deploys)\b/gi,
];

function scoreMeasurable(resume) {
  const maxScore = 15;
  let hits = 0;
  const examples = [];

  for (const pattern of MEASURABLE_PATTERNS) {
    const flags = pattern.flags.includes("i") ? "gi" : "g";
    const matches = resume.match(new RegExp(pattern.source, flags)) || [];
    hits += matches.length;
    for (const m of matches) {
      if (examples.length < 3) examples.push(m.trim());
    }
  }

  let score;
  if (hits >= 8) score = 15;
  else if (hits >= 5) score = 11;
  else if (hits >= 2) score = 7;
  else score = 2;

  const details = [
    `${hits} quantifiable achievement${hits === 1 ? "" : "s"} found${examples.length ? ` (e.g. "${examples.join('", "')}")` : ""}.`,
  ];
  if (score < 15) {
    details.push(
      "Add numbers to your impact: %, revenue, users, latency, team size.",
    );
  }

  return {
    key: "measurable",
    label: "Quantifiable Achievements",
    score,
    maxScore,
    details,
  };
}

function scoreKeywords(resume, jobDescription) {
  const maxScore = 25;

  if (!jobDescription || !jobDescription.trim()) {
    return {
      key: "keywords",
      label: "Job-Description Keyword Match",
      score: 0,
      maxScore,
      skipped: true,
      details: ["No job description provided — keyword matching skipped."],
      missingKeywords: [],
    };
  }

  const keywords = extractKeywords(jobDescription, 25);
  const matched = keywords.filter(({ word }) => keywordPresent(resume, word));
  const missing = keywords.filter(({ word }) => !keywordPresent(resume, word));

  const score =
    keywords.length === 0
      ? 0
      : Math.round((matched.length / keywords.length) * maxScore);

  return {
    key: "keywords",
    label: "Job-Description Keyword Match",
    score,
    maxScore,
    skipped: false,
    details: [
      `${matched.length}/${keywords.length} job keywords found in the resume.`,
      ...(missing.length
        ? [
            `Missing: ${missing
              .slice(0, 8)
              .map((k) => k.word)
              .join(", ")}.`,
          ]
        : ["No important keywords missing."]),
    ],
    missingKeywords: missing.map((k) => k.word),
  };
}

function scoreFormatting(resume) {
  const maxScore = 10;
  let score = 10;
  const issues = [];

  const words = resume.split(/\s+/).filter(Boolean);
  const capsWords = words.filter(
    (w) => w.length >= 4 && w === w.toUpperCase() && /[A-Z]/.test(w),
  ).length;
  if (words.length > 0 && capsWords / words.length > 0.12) {
    score -= 4;
    issues.push(
      "Excessive ALL-CAPS text — ATS parsers and recruiters prefer normal case.",
    );
  }

  const lines = resume.split("\n").filter((l) => l.trim().length > 0);
  const avgLineLength =
    lines.reduce((sum, l) => sum + l.length, 0) / Math.max(lines.length, 1);
  if (avgLineLength > 160) {
    score -= 3;
    issues.push(
      "Very long lines detected — use short bullet points for readability.",
    );
  }

  if (/(.)\1{4,}/.test(resume)) {
    score -= 3;
    issues.push(
      "Repeated characters detected (e.g. '-----') — can confuse ATS parsers.",
    );
  }

  score = Math.max(0, score);
  if (issues.length === 0)
    issues.push("No obvious formatting problems detected in the text.");

  return {
    key: "formatting",
    label: "Formatting Signals",
    score,
    maxScore,
    details: issues,
  };
}

// Main entry: returns { score, wordCount, breakdown, missingKeywords }.
// score is earned/applicable * 100, so a skipped component (no JD) never
// punishes the user.
function analyzeAts(resumeText = "", jobDescription = "") {
  const resume = resumeText || "";
  const jd = (jobDescription || "").trim();
  const wordCount = resume.split(/\s+/).filter(Boolean).length;

  const keywordResult = scoreKeywords(resume, jd);

  const breakdown = [
    scoreContact(resume),
    scoreSections(resume),
    scoreLength(wordCount),
    scoreActionVerbs(resume),
    scoreMeasurable(resume),
    {
      key: keywordResult.key,
      label: keywordResult.label,
      score: keywordResult.score,
      maxScore: keywordResult.maxScore,
      skipped: !!keywordResult.skipped,
      details: keywordResult.details,
    },
    scoreFormatting(resume),
  ];

  const applicable = breakdown.filter((b) => !b.skipped);
  const earned = applicable.reduce((sum, b) => sum + b.score, 0);
  const max = applicable.reduce((sum, b) => sum + b.maxScore, 0);
  let score = max === 0 ? 0 : Math.round((earned / max) * 100);

  // An empty resume scores 0 — no partial credit for "clean formatting"
  // when there is nothing to format.
  if (wordCount === 0) {
    for (const b of breakdown) b.score = 0;
    score = 0;
  }

  return {
    score,
    wordCount,
    breakdown,
    missingKeywords: keywordResult.missingKeywords || [],
  };
}

module.exports = { analyzeAts, extractKeywords };
