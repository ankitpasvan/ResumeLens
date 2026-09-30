// AI service: Gemini-powered qualitative feedback.
//
// Design rule: the AI layer is used ONLY for qualitative value (summaries,
// feedback, questions, recommendations). Every numeric score in the product
// is computed deterministically in the *.service modules and is never
// invented by the model. The model also never invents candidate experience:
// gaps are always phrased as "not found in the resume".

const { z } = require("zod");
const { GoogleGenAI } = require("@google/genai");
const config = require("../utils/env");

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

const MODEL = "gemini-3.6-flash";

async function generateStructured(prompt, schema) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(schema),
    },
  });
  return response.text;
}

// ---------------------------------------------------------------------------
// Interview preparation report.
// ---------------------------------------------------------------------------
const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Overall fit score of the candidate for this job, 0-100, based on the resume/self-description vs the job description",
    ),
  technicalQuestions: z
    .array(
      z.object({
        question: z.string().describe("The interview question"),
        difficulty: z
          .enum(["Easy", "Medium", "Hard"])
          .describe("Difficulty of the question"),
        expectedAnswer: z
          .string()
          .describe("What a strong answer should cover"),
      }),
    )
    .describe("8-12 technical questions tailored to the job description"),
  behavioralQuestions: z
    .array(
      z.object({
        question: z.string().describe("The behavioral interview question"),
        tip: z.string().describe("How the candidate should frame their answer"),
      }),
    )
    .describe("5-8 behavioral questions"),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("The skill or knowledge area"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe("How much this gap hurts for this job"),
        suggestion: z
          .string()
          .describe(
            "Concrete, actionable fix that does not invent experience the candidate did not provide",
          ),
      }),
    )
    .describe("Gaps between the candidate profile and the job requirements"),
  preparationPlan: z
    .array(
      z.object({
        day: z.number().describe("Day number, starting at 1"),
        focus: z.string().describe("Theme of the day"),
        tasks: z.array(z.string()).describe("Concrete tasks for the day"),
      }),
    )
    .describe("A 7-day preparation plan, most impactful topics first"),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const resumeExcerpt = (resume || "").slice(0, 6000);
  const selfExcerpt = (selfDescription || "").slice(0, 2000);
  const jdExcerpt = (jobDescription || "").slice(0, 3000);

  const prompt = `
You are an expert technical interviewer and career coach.

Create an interview preparation report for the candidate below targeting the
given job. Base everything on the candidate material provided. Never invent
experience, companies, skills, or achievements the candidate did not provide.

========================
TARGET JOB DESCRIPTION (excerpt)
========================
${jdExcerpt}

========================
CANDIDATE RESUME (excerpt)
========================
${resumeExcerpt || "(no resume provided)"}

========================
CANDIDATE SELF-DESCRIPTION
========================
${selfExcerpt || "(none provided)"}

========================
YOUR TASK
========================

1. matchScore: Overall fit score 0-100 for this job.
2. technicalQuestions: 8-12 technical questions tailored to the job
   description, each with a difficulty and what a strong answer covers.
3. behavioralQuestions: 5-8 behavioral questions with framing tips.
4. skillGaps: Gaps between the candidate's profile and the job requirements,
   each with a severity and a concrete fix. Phrase gaps as "not found in the
   provided material" — never claim the candidate lacks a skill in real life.
5. preparationPlan: A 7-day plan, most impactful topics first.

Return ONLY the structured JSON response according to the provided schema.
`;

  return generateStructured(prompt, interviewReportSchema);
}

// ---------------------------------------------------------------------------
// ATS qualitative feedback (the numeric score comes from ats.service.js).
// ---------------------------------------------------------------------------
const atsFeedbackSchema = z.object({
  summary: z.string().describe("2-3 sentence overall assessment of the resume"),
  strengths: z
    .array(z.string())
    .describe(
      "Concrete strengths, each tied to something actually present in the resume",
    ),
  weaknesses: z
    .array(
      z.object({
        issue: z.string().describe("The specific weakness found"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe("How much this weakness hurts the resume"),
        suggestion: z
          .string()
          .describe(
            "A concrete, actionable fix that does not invent experience the candidate did not provide",
          ),
      }),
    )
    .describe("Weaknesses ordered by impact"),
  suggestions: z
    .array(z.string())
    .describe(
      "Prioritized concrete improvements, most impactful first, maximum 7",
    ),
});

async function generateAtsFeedback({ resumeText, jobDescription, findings }) {
  const resumeExcerpt = (resumeText || "").slice(0, 6000);
  const jdExcerpt = (jobDescription || "").slice(0, 3000);

  const findingsText = findings.breakdown
    .map(
      (b) =>
        `- ${b.label}: ${
          b.skipped
            ? "skipped (not enough information to judge)"
            : `${b.score}/${b.maxScore}`
        } — ${b.details.join(" ")}`,
    )
    .join("\n");

  const prompt = `
You are an expert resume reviewer and ATS specialist.

Review the resume below and produce qualitative feedback that explains and
complements the deterministic ATS findings. Do NOT invent a numeric score —
the score is already computed and shown below.

========================
RESUME (excerpt)
========================
${resumeExcerpt}

========================
TARGET JOB DESCRIPTION (excerpt)
========================
${jdExcerpt || "(none provided — general resume review)"}

========================
DETERMINISTIC ATS FINDINGS
========================
ATS score: ${findings.score}/100
${findingsText}
Missing keywords: ${findings.missingKeywords.join(", ") || "(none)"}

========================
YOUR TASK
========================

1. summary: A 2-3 sentence overall assessment of the resume.
2. strengths: Concrete strengths tied to things actually in the resume.
3. weaknesses: Specific weaknesses ordered by impact, each with a severity
   and a concrete fix.
4. suggestions: Prioritized concrete improvements, most impactful first
   (maximum 7).

========================
IMPORTANT INSTRUCTIONS
========================

- Base everything on the resume text provided. Never invent experience,
  companies, skills, or achievements.
- Phrase gaps as "not found in the resume" — never claim the candidate
  lacks a skill in real life.
- Be specific: reference actual resume content where possible.
- Do not repeat the numeric breakdown; explain what the candidate should
  DO about it.
- Return ONLY the structured JSON response according to the provided schema.
`;

  return generateStructured(prompt, atsFeedbackSchema);
}

// ---------------------------------------------------------------------------
// Resume↔job match feedback (the numeric score comes from match.service.js).
// ---------------------------------------------------------------------------
const matchFeedbackSchema = z.object({
  summary: z
    .string()
    .describe(
      "2-3 sentence overall assessment of how well the resume fits this job",
    ),

  strengths: z
    .array(z.string())
    .describe(
      "Concrete fit strengths, each tied to something actually present in the resume",
    ),

  gaps: z
    .array(
      z.object({
        issue: z.string().describe("The specific gap found"),

        severity: z
          .enum(["low", "medium", "high"])
          .describe("How much this gap hurts the candidate's fit for the job"),

        suggestion: z
          .string()
          .describe(
            "A concrete, actionable fix that does not invent experience the candidate did not provide",
          ),
      }),
    )
    .describe("Gaps ordered by impact on the candidate's fit for this job"),

  recommendations: z
    .array(z.string())
    .describe(
      "Prioritized concrete next steps for the candidate (resume tweaks, skills to highlight, or honest upskilling pointers), most impactful first, maximum 7",
    ),
});

async function generateMatchFeedback({
  resumeText,
  jobTitle,
  jobDescription,
  findings,
}) {
  const resumeExcerpt = (resumeText || "").slice(0, 6000);
  const jdExcerpt = (jobDescription || "").slice(0, 3000);

  const findingsText = findings.breakdown
    .map(
      (b) =>
        `- ${b.label}: ${
          b.skipped
            ? "skipped (not enough information to judge)"
            : `${b.score}/${b.maxScore}`
        } — ${b.details.join(" ")}`,
    )
    .join("\n");

  const prompt = `
You are an expert hiring consultant and career coach.

Assess how well the candidate's resume fits the target job below and produce
qualitative feedback that explains and complements the deterministic match
findings. Do NOT invent a numeric score — the score is already computed and
shown below.

========================
TARGET JOB TITLE
========================
${jobTitle}

========================
TARGET JOB DESCRIPTION (excerpt)
========================
${jdExcerpt}

========================
CANDIDATE RESUME (excerpt)
========================
${resumeExcerpt}

========================
DETERMINISTIC MATCH FINDINGS
========================
Match score: ${findings.score}/100
${findingsText}
Matched skills: ${findings.matchedSkills.join(", ") || "(none)"}
Skills in the job description not found in the resume: ${
    findings.missingSkills.join(", ") || "(none)"
  }

========================
YOUR TASK
========================

1. summary: A 2-3 sentence overall assessment of the fit.
2. strengths: Concrete fit strengths, each tied to something actually present in the resume.
3. gaps: Specific gaps ordered by impact, each with a severity and a concrete fix.
4. recommendations: Prioritized concrete next steps, most impactful first (maximum 7).

========================
IMPORTANT INSTRUCTIONS
========================

- Base everything on the resume text provided. Never invent experience, companies, skills, or achievements.
- Phrase gaps as "not found in the resume" — never claim the candidate lacks a skill in real life.
- Be specific: reference actual resume content where possible.
- Do not repeat the numeric breakdown; explain what the candidate should DO about it.
- Return ONLY the structured JSON response according to the provided schema.
`;

  return generateStructured(prompt, matchFeedbackSchema);
}

// ---------------------------------------------------------------------------
// Resume PDF generation (placeholder: returns a minimal valid one-page PDF
// so the download endpoint works end-to-end; replace with a real renderer
// when resume templating is built).
// ---------------------------------------------------------------------------
async function generateResumePdf(resumeText) {
  const lines = (resumeText || "Resume")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 40);

  const safe = (s) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .slice(0, 90);

  let y = 760;
  let content = "BT /F1 11 Tf\n";
  for (const line of lines) {
    content += `50 ${y} Td (${safe(line)}) Tj\n`;
    y -= 16;
    if (y < 50) break;
  }
  content += "ET";

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return Buffer.from(pdf, "utf-8");
}

module.exports = {
  generateInterviewReport,
  generateAtsFeedback,
  generateMatchFeedback,
  generateResumePdf,
};
