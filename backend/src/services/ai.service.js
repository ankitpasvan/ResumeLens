// Structured qualitative feedback for resume↔job matching. The numeric
// match score is computed deterministically in match.service.js; the AI
// only explains the fit and suggests concrete next steps — it never
// invents the score and never invents candidate experience.
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

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,

    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(matchFeedbackSchema),
    },
  });

  return response.text;
}

module.exports = {
  generateInterviewReport,
  generateAtsFeedback,
  generateMatchFeedback,
  generateResumePdf,
};
