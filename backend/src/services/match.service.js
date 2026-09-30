// Deterministic resume↔job matching.
//
// This module contains NO AI calls on purpose. Every point is awarded by a
// transparent, explainable rule, so the match score is reproducible and the
// API response can tell the user exactly which skills matched, which were
// not found in the resume, and how each scoring component contributed.
// The Gemini layer (ai.service.js) only adds qualitative feedback
// (summary / strengths / gaps / recommendations) on top of these findings.

const { extractKeywords } = require("./ats.service");

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Whole-word, case-insensitive match. The boundary class excludes
// [a-z0-9+#.] so "Java" never matches inside "JavaScript", "Go" never
// matches inside "MongoDB", and "C++" never matches inside "C++17".
function termPresent(text, term) {
  const re = new RegExp(
    `(^|[^a-z0-9+#.])${escapeRegExp(term)}([^a-z0-9+#.]|$)`,
    "i",
  );
  return re.test(text || "");
}

// Canonical skill vocabulary. `aliases` are alternative spellings that count
// as the same skill. Entries with `skipBareName` are only matched through
// their aliases (e.g. bare "go" is an English verb — only "golang" counts).
const SKILL_VOCABULARY = [
  // Languages
  { name: "JavaScript", aliases: [] },
  { name: "TypeScript", aliases: [] },
  { name: "Python", aliases: [] },
  { name: "Java", aliases: [] },
  { name: "C++", aliases: [] },
  { name: "C#", aliases: ["c-sharp", "csharp"] },
  { name: "Go", aliases: ["golang"], skipBareName: true },
  { name: "Rust", aliases: [] },
  { name: "Kotlin", aliases: [] },
  { name: "Swift", aliases: [] },
  { name: "PHP", aliases: [] },
  { name: "Ruby", aliases: [] },
  { name: "Scala", aliases: [] },
  { name: "SQL", aliases: [] },
  // Frontend
  { name: "React", aliases: ["react.js", "reactjs"] },
  { name: "Angular", aliases: [] },
  { name: "Vue.js", aliases: ["vue"] },
  { name: "Next.js", aliases: ["nextjs"] },
  { name: "HTML", aliases: ["html5"] },
  { name: "CSS", aliases: ["css3"] },
  { name: "Tailwind CSS", aliases: ["tailwind"] },
  { name: "Redux", aliases: [] },
  // Backend
  { name: "Node.js", aliases: ["nodejs", "node.js"] },
  { name: "Express", aliases: ["express.js", "expressjs"] },
  { name: "Django", aliases: [] },
  { name: "Flask", aliases: [] },
  { name: "FastAPI", aliases: ["fast api"] },
  { name: "Spring Boot", aliases: ["spring"] },
  { name: ".NET", aliases: ["dotnet", "asp.net"] },
  { name: "GraphQL", aliases: [] },
  { name: "REST APIs", aliases: ["restful", "rest api"] },
  // Mobile
  { name: "React Native", aliases: [] },
  { name: "Flutter", aliases: [] },
  { name: "Android", aliases: [] },
  { name: "iOS", aliases: ["ios"] },
  // Data & AI
  { name: "Machine Learning", aliases: ["ml"] },
  { name: "Deep Learning", aliases: [] },
  { name: "TensorFlow", aliases: [] },
  { name: "PyTorch", aliases: [] },
  { name: "scikit-learn", aliases: ["sklearn"] },
  { name: "Pandas", aliases: [] },
  { name: "NumPy", aliases: ["numpy"] },
  { name: "NLP", aliases: ["natural language processing"] },
  { name: "Computer Vision", aliases: [] },
  { name: "Data Analysis", aliases: [] },
  { name: "Statistics", aliases: [] },
  { name: "Power BI", aliases: ["powerbi"] },
  { name: "Tableau", aliases: [] },
  { name: "Excel", aliases: ["ms excel"] },
  // Cloud & DevOps
  { name: "AWS", aliases: ["amazon web services"] },
  { name: "Azure", aliases: ["microsoft azure"] },
  { name: "Google Cloud", aliases: ["gcp"] },
  { name: "Docker", aliases: [] },
  { name: "Kubernetes", aliases: ["k8s"] },
  { name: "CI/CD", aliases: ["cicd", "ci cd"] },
  { name: "Jenkins", aliases: [] },
  { name: "Terraform", aliases: [] },
  { name: "Git", aliases: ["github", "gitlab"] },
  { name: "Linux", aliases: [] },
  { name: "Nginx", aliases: [] },
  { name: "Redis", aliases: [] },
  { name: "Kafka", aliases: ["apache kafka"] },
  // Databases
  { name: "MongoDB", aliases: ["mongo"] },
  { name: "PostgreSQL", aliases: ["postgres"] },
  { name: "MySQL", aliases: [] },
  { name: "SQLite", aliases: [] },
  { name: "Elasticsearch", aliases: [] },
  { name: "Firebase", aliases: [] },
  { name: "Supabase", aliases: [] },
  { name: "DynamoDB", aliases: [] },
  // CS fundamentals & practices
  { name: "System Design", aliases: [] },
  { name: "Microservices", aliases: ["micro-services"] },
  { name: "Data Structures", aliases: [] },
  { name: "Algorithms", aliases: [] },
  { name: "OOP", aliases: ["object-oriented programming", "object oriented"] },
  { name: "Agile", aliases: [] },
  { name: "Scrum", aliases: [] },
  { name: "Jira", aliases: [] },
  { name: "Figma", aliases: [] },
  { name: "Postman", aliases: [] },
  { name: "Unit Testing", aliases: ["jest", "pytest", "junit"] },
];

function skillPresent(text, skill) {
  const terms = skill.skipBareName
    ? skill.aliases
    : [skill.name, ...skill.aliases];
  return terms.some((t) => termPresent(text, t));
}

// Skills the job description asks for (canonical names).
function extractJobSkills(jobDescription) {
  return SKILL_VOCABULARY.filter((s) => skillPresent(jobDescription, s)).map(
    (s) => s.name,
  );
}

// Highest "N years" figure found in a text, 0 when none is mentioned.
function extractYears(text) {
  const matches = [
    ...(text || "").matchAll(/(\d+)\s*\+?\s*(?:years?|yrs?)\b/gi),
  ];
  let max = 0;
  for (const m of matches) {
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n) && n > max && n <= 50) max = n;
  }
  return max;
}

const TITLE_STOPWORDS = new Set([
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
  "we",
  "you",
  "job",
  "role",
  "hiring",
]);

function significantTitleWords(jobTitle) {
  return (jobTitle || "")
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((w) => w.length > 2 && !TITLE_STOPWORDS.has(w));
}

// --- Scoring components (same { key, label, score, maxScore, skipped, details }
// shape as the ATS scorer) --------------------------------------------------

function scoreSkillOverlap(resume, jobDescription) {
  const maxScore = 40;
  const jobSkills = extractJobSkills(jobDescription);

  if (jobSkills.length === 0) {
    return {
      key: "skills",
      label: "Skill Overlap",
      score: 0,
      maxScore,
      skipped: true,
      details: [
        "No recognizable skills found in the job description — skill overlap skipped.",
      ],
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const byName = new Map(SKILL_VOCABULARY.map((s) => [s.name, s]));
  const matched = jobSkills.filter((name) =>
    skillPresent(resume, byName.get(name)),
  );
  const missing = jobSkills.filter((name) => !matched.includes(name));
  const score = Math.round((matched.length / jobSkills.length) * maxScore);

  return {
    key: "skills",
    label: "Skill Overlap",
    score,
    maxScore,
    skipped: false,
    details: [
      `${matched.length}/${jobSkills.length} required skills found in the resume.`,
      ...(missing.length
        ? [`Not found in the resume: ${missing.slice(0, 10).join(", ")}.`]
        : ["Every required skill appears in the resume."]),
    ],
    matchedSkills: matched,
    missingSkills: missing,
  };
}

function scoreKeywordCoverage(resume, jobDescription) {
  const maxScore = 30;

  if (!jobDescription || !jobDescription.trim()) {
    return {
      key: "keywords",
      label: "Keyword Coverage",
      score: 0,
      maxScore,
      skipped: true,
      details: ["No job description provided — keyword coverage skipped."],
    };
  }

  const keywords = extractKeywords(jobDescription, 25);
  if (keywords.length === 0) {
    return {
      key: "keywords",
      label: "Keyword Coverage",
      score: 0,
      maxScore,
      skipped: true,
      details: ["No meaningful keywords in the job description — skipped."],
    };
  }

  const matched = keywords.filter(({ word }) => termPresent(resume, word));
  const score = Math.round((matched.length / keywords.length) * maxScore);

  return {
    key: "keywords",
    label: "Keyword Coverage",
    score,
    maxScore,
    skipped: false,
    details: [
      `${matched.length}/${keywords.length} job-description keywords found in the resume.`,
    ],
  };
}

function scoreExperienceFit(resume, jobDescription) {
  const maxScore = 15;
  const required = extractYears(jobDescription);

  if (required === 0) {
    return {
      key: "experience",
      label: "Experience Fit",
      score: 0,
      maxScore,
      skipped: true,
      details: [
        "The job description states no years-of-experience requirement — experience fit skipped.",
      ],
    };
  }

  const have = extractYears(resume);
  const score =
    have >= required ? maxScore : Math.round((have / required) * maxScore);

  return {
    key: "experience",
    label: "Experience Fit",
    score,
    maxScore,
    skipped: false,
    details: [
      have >= required
        ? `Resume shows ~${have} years vs ${required} required — requirement met.`
        : `Resume shows ~${have} years vs ${required} required.`,
    ],
  };
}

function scoreTitleRelevance(resume, jobTitle) {
  const maxScore = 15;
  const words = significantTitleWords(jobTitle);

  if (words.length === 0) {
    return {
      key: "title",
      label: "Title Relevance",
      score: 0,
      maxScore,
      skipped: true,
      details: ["No significant words in the job title — skipped."],
    };
  }

  const matched = words.filter((w) => termPresent(resume, w));
  const score = Math.round((matched.length / words.length) * maxScore);

  return {
    key: "title",
    label: "Title Relevance",
    score,
    maxScore,
    skipped: false,
    details: [
      `${matched.length}/${words.length} significant title words appear in the resume.`,
    ],
  };
}

// Main entry: returns { score, breakdown, matchedSkills, missingSkills }.
// score is earned/applicable * 100, so a skipped component never punishes
// the user. An empty resume scores 0.
function matchResumeToJob(resumeText = "", jobTitle = "", jobDescription = "") {
  const resume = resumeText || "";
  const wordCount = resume.split(/\s+/).filter(Boolean).length;

  const skillResult = scoreSkillOverlap(resume, jobDescription);

  const breakdown = [
    {
      key: skillResult.key,
      label: skillResult.label,
      score: skillResult.score,
      maxScore: skillResult.maxScore,
      skipped: !!skillResult.skipped,
      details: skillResult.details,
    },
    scoreKeywordCoverage(resume, jobDescription),
    scoreExperienceFit(resume, jobDescription),
    scoreTitleRelevance(resume, jobTitle),
  ];

  const applicable = breakdown.filter((b) => !b.skipped);
  const earned = applicable.reduce((sum, b) => sum + b.score, 0);
  const max = applicable.reduce((sum, b) => sum + b.maxScore, 0);
  let score = max === 0 ? 0 : Math.round((earned / max) * 100);

  if (wordCount === 0) {
    for (const b of breakdown) b.score = 0;
    score = 0;
  }

  return {
    score,
    breakdown,
    matchedSkills: skillResult.matchedSkills || [],
    missingSkills: skillResult.missingSkills || [],
  };
}

module.exports = { matchResumeToJob, SKILL_VOCABULARY };
