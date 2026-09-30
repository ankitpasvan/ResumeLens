const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const config = require("../utils/env");

const ai = new GoogleGenAI({
  apiKey: config.geminiApiKey,
});

// This schema is the single contract for the AI output. It matches the
// Mongoose report schema and the fields the frontend renders, so nothing
// gets silently dropped by Mongoose strict mode.
const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the job description",
    ),

  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),

        difficulty: z
          .enum(["Easy", "Medium", "Hard"])
          .describe("The difficulty level of the question"),

        expectedAnswer: z
          .string()
          .describe(
            "How to answer this question: the important concepts, points, examples, and approach to cover",
          ),
      }),
    )
    .describe(
      "Technical questions that can be asked in the interview, with difficulty and guidance on answering them",
    ),

  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            "The behavioral question that can be asked in the interview",
          ),

        tip: z
          .string()
          .describe(
            "A tip for answering: how to structure the response, e.g. using the STAR method",
          ),
      }),
    )
    .describe(
      "Behavioral questions that can be asked in the interview along with tips for answering them",
    ),

  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),

        severity: z
          .enum(["low", "medium", "high"])
          .describe("The severity of this skill gap"),

        suggestion: z
          .string()
          .describe(
            "A concrete suggestion for how the candidate can close this gap",
          ),
      }),
    )
    .describe(
      "List of skill gaps in the candidate's profile along with their severity and suggestions",
    ),

  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe("The day number in the preparation plan, starting from 1"),

        focus: z
          .string()
          .describe("The main focus of this day in the preparation plan"),

        tasks: z
          .array(z.string())
          .describe("List of tasks to be done on this day"),
      }),
    )
    .describe(
      "A day-wise plan for the candidate to follow in order to prepare for the interview effectively",
    ),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  // Create prompt
  const prompt = `
You are an expert technical interviewer and career coach.

Your task is to analyze the candidate's resume, self-description, and the given job description very carefully and generate a detailed interview preparation report.

Do NOT give generic advice. Your response must be specifically tailored to the candidate's actual skills, experience, projects, and the requirements mentioned in the job description.

========================
CANDIDATE RESUME
========================
${resume}

========================
CANDIDATE SELF DESCRIPTION
========================
${selfDescription}

========================
JOB DESCRIPTION
========================
${jobDescription}

========================
YOUR TASK
========================

Analyze all three inputs and perform the following tasks:

1. MATCH SCORE
Calculate a realistic match score between 0 and 100.

The score should be based on:
- Required technical skills
- Years of experience
- Relevant technologies
- Database knowledge
- Backend development experience
- Cloud and DevOps knowledge
- Authentication and authorization experience
- Testing experience
- System design experience
- Responsibilities mentioned in the job description

Do not give an unnecessarily high score. If the candidate is missing important requirements, reduce the score accordingly.

2. TECHNICAL INTERVIEW QUESTIONS

Generate realistic technical interview questions that an interviewer is likely to ask this candidate.

Questions must be based on:
- Technologies mentioned in the resume
- Technologies required in the job description
- Candidate's work experience
- Candidate's projects
- Skills that appear in both the resume and job description
- Skills that the candidate claims to know

Include questions from different difficulty levels:
- Easy
- Medium
- Hard

For every technical question provide:

- question: The exact interview question.
- difficulty: One of "Easy", "Medium", or "Hard".
- expectedAnswer: Explain how the candidate should answer. Include the important concepts, points, examples, and approach that should be discussed.

Avoid asking the same question in different forms.

3. BEHAVIORAL INTERVIEW QUESTIONS

Generate realistic behavioral and HR questions based specifically on the candidate's background and the job description.

Include questions related to:
- Previous work experience
- Challenging technical problems
- Team collaboration
- Working with frontend and DevOps teams
- Handling production issues
- Conflict resolution
- Leadership or ownership
- Communication
- Failure and learning
- Time management
- Why the candidate wants this role
- Why the candidate is suitable for this company/role

For every behavioral question provide:

- question
- tip: How the candidate should structure their response. When appropriate, recommend using the STAR method: Situation → Task → Action → Result.

Do not invent achievements or experiences that are not present in the resume. If an example is required but not available, explain what type of example the candidate should provide.

4. SKILL GAPS

Compare the candidate's skills with the job requirements carefully.

Identify skills that:
- Are explicitly required but missing from the resume
- Are mentioned by the candidate but not supported by experience
- Need stronger practical knowledge
- Are important for performing the job successfully

For every skill gap provide:
- skill: Name of the missing or weak skill
- severity: low, medium, or high
- suggestion: A concrete suggestion for closing the gap

Use:
- high = important requirement and candidate has little/no evidence of it
- medium = useful requirement but candidate has partial knowledge
- low = minor gap or easily learnable skill

Do not list skills as gaps if the candidate clearly demonstrates them in the resume.

5. PREPARATION PLAN

Create a practical day-by-day interview preparation plan.

The plan should prioritize the most important gaps and requirements first.

Start from Day 1.

Each day should contain:
- day: Day number
- focus: Main topic to study
- tasks: Specific tasks that the candidate should complete

The preparation plan should include:
- Technical fundamentals
- Job-specific technologies
- Backend concepts
- Database optimization
- API development
- Authentication and authorization
- Caching
- System design
- Testing
- Docker/cloud concepts if relevant
- Resume/project revision
- Behavioral interview preparation
- Mock interview practice

Make the preparation plan practical and focused on interview preparation rather than general learning.

========================
IMPORTANT INSTRUCTIONS
========================

- Base the entire report on the provided resume, self-description, and job description.
- Do not invent candidate experience, companies, projects, technologies, or achievements.
- Prioritize skills explicitly mentioned in the job description.
- Give realistic interview questions rather than textbook-only questions.
- Questions should reflect what an interviewer would actually ask a candidate with this level of experience.
- Clearly identify strengths as well as weaknesses.
- Keep the match score realistic.
- Make answers detailed enough for interview preparation but not unnecessarily long.
- Avoid duplicate questions.
- Make the preparation plan actionable.
- Return ONLY the structured JSON response according to the provided schema.
`;

  // Send prompt to Gemini
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,

    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(interviewReportSchema),
    },
  });

  // Return response
  return response.text;
}

// Structured qualitative feedback for the ATS analyzer. The numeric score
// itself is computed deterministically in ats.service.js; the AI only
// explains strengths/weaknesses and suggests concrete improvements — it
// never invents the score and never invents candidate experience.
const atsFeedbackSchema = z.object({
  summary: z.string().describe("2-3 sentence overall assessment of the resume"),

  strengths: z
    .array(z.string())
    .describe(
      "Concrete strengths actually found in the resume, each tied to real resume content",
    ),

  weaknesses: z
    .array(
      z.object({
        issue: z.string().describe("The specific weakness found"),

        severity: z
          .enum(["low", "medium", "high"])
          .describe("How much this weakness hurts the ATS score"),

        suggestion: z
          .string()
          .describe(
            "A concrete, actionable fix that does not invent experience the candidate did not provide",
          ),
      }),
    )
    .describe("Weaknesses ordered by impact on the ATS score"),

  suggestions: z
    .array(z.string())
    .describe(
      "Prioritized list of concrete resume improvements, most impactful first",
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
            ? "skipped (no job description provided)"
            : `${b.score}/${b.maxScore}`
        } — ${b.details.join(" ")}`,
    )
    .join("\n");

  const prompt = `
You are an expert resume reviewer and hiring consultant.

Analyze the candidate's resume (and the target job description, if provided)
and produce qualitative feedback that explains and complements the
deterministic ATS findings below. Do NOT invent a numeric score — the score
is already computed and shown below.

========================
CANDIDATE RESUME (excerpt)
========================
${resumeExcerpt}

========================
TARGET JOB DESCRIPTION (may be empty)
========================
${jdExcerpt || "(none provided)"}

========================
DETERMINISTIC ATS FINDINGS
========================
Score: ${findings.score}/100
${findingsText}
Missing keywords: ${findings.missingKeywords.join(", ") || "(none)"}

========================
YOUR TASK
========================

1. summary: A 2-3 sentence overall assessment of the resume.
2. strengths: Concrete strengths, each tied to something actually present in the resume.
3. weaknesses: Specific weaknesses ordered by impact, each with a severity and a concrete fix.
4. suggestions: Prioritized concrete improvements, most impactful first (maximum 7).

========================
IMPORTANT INSTRUCTIONS
========================

- Base everything on the resume text provided. Never invent experience, companies, skills, or achievements.
- Phrase gaps as "not found in the resume" — never claim the candidate lacks a skill in real life.
- Be specific: reference actual resume content where possible.
- Do not repeat the numeric breakdown; explain what the candidate should DO about it.
- Return ONLY the structured JSON response according to the provided schema.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,

    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(atsFeedbackSchema),
    },
  });

  return response.text;
}

// Placeholder: returns a minimal valid PDF so the download endpoint works
// end to end. Replaced by a real PDF generator in a later phase.
async function generateResumePdf(resume) {
  const content = `%PDF-1.4\n1 0 obj\n<< /Title (Interview Strategy Resume) >>\nendobj\ntrailer\n<< >>\n%%EOF`;
  return Buffer.from(content, "utf-8");
}

module.exports = {
  generateInterviewReport,
  generateAtsFeedback,
  generateResumePdf,
};
