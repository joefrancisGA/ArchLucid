export const FIRST_REVIEW_GUIDE_STEP_COUNT = 7;

export type FirstReviewGuideStepDefinition = {
  readonly title: string;
  readonly explanation: string;
};

/** IR-003: Working first-review journey — inhabit the architecture; findings are the afternoon document. */
export const FIRST_REVIEW_GUIDE_STEPS: readonly FirstReviewGuideStepDefinition[] = [
  {
    title: "Open this architecture on the desk",
    explanation:
      "Start from the architecture portfolio. The system you are reviewing is the object you inhabit — not a reviews inbox row.",
  },
  {
    title: "Capture identity and start review",
    explanation:
      "Describe the system, business goal, scope, and constraints in the wizard. Record + Simulator honesty appears before execute when it applies.",
  },
  {
    title: "Work findings on the inhabited document",
    explanation:
      "After Start review, disposition, transparency trail, and quiet-engine honesty live on architecture-nested findings.",
  },
  {
    title: "Address material findings",
    explanation: "Record remediation, decisions, exceptions, or accepted risk on the finding rows you triage all day.",
  },
  {
    title: "Seal when ready",
    explanation:
      "Seal the review record from the findings document. Finalize returns you to the architecture desk with a locked sealed record.",
  },
  {
    title: "Add inventory evidence when needed",
    explanation:
      "Optional Azure inventory ZIP or other evidence can follow seal — it does not replace findings work on the open architecture.",
  },
  {
    title: "Share the architecture package",
    explanation: "Open or export the sealed review record and sponsor artifacts for stakeholders.",
  },
] as const;

if (FIRST_REVIEW_GUIDE_STEPS.length !== FIRST_REVIEW_GUIDE_STEP_COUNT) {
  throw new Error(
    `FIRST_REVIEW_GUIDE_STEP_COUNT (${FIRST_REVIEW_GUIDE_STEP_COUNT}) must match FIRST_REVIEW_GUIDE_STEPS.length (${FIRST_REVIEW_GUIDE_STEPS.length}).`,
  );
}
