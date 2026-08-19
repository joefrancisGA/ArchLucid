export const FIRST_REVIEW_GUIDE_STEP_COUNT = 7;

export type FirstReviewGuideStepDefinition = {
  readonly title: string;
  readonly explanation: string;
};

/** Customer-facing first-review journey — aligned to the Core Pilot lifecycle without implementation jargon. */
export const FIRST_REVIEW_GUIDE_STEPS: readonly FirstReviewGuideStepDefinition[] = [
  {
    title: "Define the architecture",
    explanation: "Describe the system, business goal, scope, and constraints.",
  },
  {
    title: "Add requirements and evidence",
    explanation: "Provide the documents, decisions, and context the review should evaluate.",
  },
  {
    title: "Evaluate the architecture review",
    explanation: "Evaluate the architecture against the selected policies and standards.",
  },
  {
    title: "Review findings",
    explanation: "Inspect severity, business impact, evidence, and recommendations.",
  },
  {
    title: "Address material findings",
    explanation: "Record remediation, decisions, exceptions, or accepted risk.",
  },
  {
    title: "Finalize the review",
    explanation: "Commit the review record and preserve its evidence and decisions.",
  },
  {
    title: "Share the review",
    explanation: "Open or export the finalized package for stakeholders.",
  },
] as const;

if (FIRST_REVIEW_GUIDE_STEPS.length !== FIRST_REVIEW_GUIDE_STEP_COUNT) {
  throw new Error(
    `FIRST_REVIEW_GUIDE_STEP_COUNT (${FIRST_REVIEW_GUIDE_STEP_COUNT}) must match FIRST_REVIEW_GUIDE_STEPS.length (${FIRST_REVIEW_GUIDE_STEPS.length}).`,
  );
}
