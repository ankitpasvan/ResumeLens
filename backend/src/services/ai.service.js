const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const temp = require("./temp");

const dotenv = require("dotenv");
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

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

        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),

        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Technical questions that can be asked in the interview along with their intention",
    ),

  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            "The behavioral question that can be asked in the interview",
          ),

        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),

        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Behavioral questions that can be asked in the interview along with their intention and how to answer them",
    ),

  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),

        severity: z
          .enum(["low", "medium", "high"])
          .describe("The severity of this skill gap"),
      }),
    )
    .describe(
      "List of skill gaps in the candidate's profile along with their severity",
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
- Basic
- Intermediate
- Advanced

For every technical question provide:

- question: The exact interview question.
- intention: Explain what the interviewer is trying to evaluate.
- answer: Explain how the candidate should answer. Include the important concepts, points, examples, and approach that should be discussed.

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
- intention
- answer

The answer should explain how the candidate should structure their response. When appropriate, recommend using the STAR method:
Situation → Task → Action → Result.

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
      responseJsonSchema: zodToJsonSchema(interviewReportSchema),
    },
  });

  // Print AI response
  console.log(response.text);

  // Return response
  return response.text;
}

async function generateInterview({ resume, selfDescription, jobDescription }) {
  const prompt = `Generate an interview report for a candidate with the following details:
     Resume:${resume}
     Self Description:${selfDescription}
     job Description:${jobDescription}
     `;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,

    config: {
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(interviewReportSchema),
    },
  });

  console.log(JSON.parse(response.text));
  console.log(response.text);
}

async function invokeGeminiAi() {
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",

    contents: "Hello Gemini! Explain what an interview is.",
  });

  console.log(response.text);
}

module.exports = {
  generateInterviewReport,
  invokeGeminiAi,
  generateInterview,
};
