export type ReviewsNewPathMode = "quick-review" | "guided-intake" | "detailed";

/** Deep link for born-governed creation intake (guided clarifying questions). */
export const REVIEWS_NEW_GUIDED_INTAKE_HREF = "/architecture/reviews/new?path=guided-intake" as const;

/** Deep link for templates / imports detailed wizard path. */
export const REVIEWS_NEW_DETAILED_HREF = "/architecture/reviews/new?path=detailed" as const;

/** Deep link for quick-start first-pilot path. */
export const REVIEWS_NEW_QUICK_REVIEW_HREF = "/architecture/reviews/new?path=quick-review" as const;

/** Homepage Create Architecture — canonical architecture draft bootstrap route. */
export const REVIEWS_NEW_CREATE_ARCHITECTURE_HREF = "/architecture/architectures/new" as const;

/** Single-line example — sample brief button supplies the full narrative. */
export const REVIEWS_NEW_BRIEF_PLACEHOLDER =
  "Example: Customer-facing retail API with private networking, managed database, cache tier, and EU data residency goals. Include PCI-sensitive payment isolation, 99.9% availability targets, and phased migration from an on-prem monolith.";

/** Mode-specific hint shown under the path tabs (one sentence per active mode). */
export const REVIEWS_NEW_PATH_HINTS: Record<ReviewsNewPathMode, string> = {
  "guided-intake":
    "Structured clarifying questions when you want readiness checks and branch drafts before analysis.",
  "quick-review":
    "Fastest first-pilot path: review title, attach evidence, and start analysis in one screen.",
  detailed:
    "Use templates, imports, and evidence upload when you need an export-ready review with full configuration.",
};

/** Proof collection reminder after commit (operator copy). */
export const REVIEWS_NEW_PROOF_COLLECTION_HINT =
  "After commit, collect buyer-safe proof: .\\scripts\\collect-first-pilot-proof.ps1 -RunId <review-id> -SponsorHandoff";
