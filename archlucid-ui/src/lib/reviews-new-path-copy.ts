export type ReviewsNewPathMode = "quick-review" | "guided-intake" | "detailed";

/** Deep link for born-governed creation intake (guided clarifying questions). */
export const REVIEWS_NEW_GUIDED_INTAKE_HREF = "/architecture/reviews/new?path=guided-intake" as const;

/** Deep link for templates / imports detailed wizard path. */
export const REVIEWS_NEW_DETAILED_HREF = "/architecture/reviews/new?path=detailed" as const;

/** Deep link for quick-start first-review path. */
export const REVIEWS_NEW_QUICK_REVIEW_HREF = "/architecture/reviews/new?path=quick-review" as const;

/** Tab and secondary-path label — avoids eng “intake” jargon on golden-path chrome. */
export const REVIEWS_NEW_GUIDED_QUESTIONS_LABEL = "Guided questions";

/** Homepage Create Architecture — canonical architecture draft bootstrap route. */
export const REVIEWS_NEW_CREATE_ARCHITECTURE_HREF = "/architecture/architectures/new" as const;

/** Single-line example — sample brief button supplies the full narrative. */
export const REVIEWS_NEW_BRIEF_PLACEHOLDER =
  "Example: Customer-facing retail API with private networking, managed database, cache tier, and EU data residency goals. Include PCI-sensitive payment isolation, 99.9% availability targets, and phased migration from an on-prem monolith.";

/** Mode-specific hint shown under the path tabs (one sentence per active mode). */
export const REVIEWS_NEW_PATH_HINTS: Record<ReviewsNewPathMode, string> = {
  "guided-intake":
    "Structured clarifying questions when you want readiness checks and branch drafts before starting the review.",
  "quick-review":
    "Quick start: review title, attach evidence, and start a review in one screen.",
  detailed:
    "Use templates, imports, and evidence upload when you need an export-ready review with full configuration.",
};

/** First-run progressive disclosure — secondary creation paths (TB-2130). */
export const REVIEWS_NEW_MORE_WAYS_TO_START_TITLE = "More ways to start";

export const REVIEWS_NEW_MORE_WAYS_TO_START_SUMMARY =
  "Guided questions or templates and imports when you need more control.";

export const REVIEWS_NEW_BACK_TO_QUICK_START_CTA = "Back to quick start";

/** Proof collection reminder after finalize (technical script path retained). */
export const REVIEWS_NEW_PROOF_COLLECTION_HINT =
  "After finalize, collect buyer-safe proof: .\\scripts\\collect-first-pilot-proof.ps1 -RunId <review-id> -SponsorHandoff";
