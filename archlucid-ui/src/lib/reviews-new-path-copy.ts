export type ReviewsNewPathMode = "quick-review" | "guided-intake" | "detailed";

/** Deep link for born-governed creation intake (guided clarifying questions). */
export const REVIEWS_NEW_GUIDED_INTAKE_HREF = "/reviews/new?path=guided-intake" as const;

/** Homepage Create Architecture — explicit creation intent, no review initialization. */
export const REVIEWS_NEW_CREATE_ARCHITECTURE_HREF =
  "/reviews/new?path=guided-intake&intent=create-architecture" as const;

/** Single-line example — sample brief button supplies the full narrative. */
export const REVIEWS_NEW_BRIEF_PLACEHOLDER =
  "Example: Customer-facing retail API on Azure using App Service, Azure SQL, Redis, and private networking. Goals include PCI-sensitive payment isolation, 99.9% availability, EU data residency, and phased migration from an on-prem monolith.";

/** Mode-specific hint shown under the path tabs (one sentence per active mode). */
export const REVIEWS_NEW_PATH_HINTS: Record<ReviewsNewPathMode, string> = {
  "guided-intake":
    "Structured clarifying questions when you want admission gates and branch drafts before analysis.",
  "quick-review":
    "Fastest first-pilot path: review title, attach evidence, and start analysis in one screen.",
  detailed:
    "Use templates, imports, and evidence upload when you need an export-ready review package with full configuration.",
};

/** Proof collection reminder after commit (operator copy). */
export const REVIEWS_NEW_PROOF_COLLECTION_HINT =
  "After commit, collect buyer-safe proof: .\\scripts\\collect-first-pilot-proof.ps1 -RunId <review-id> -SponsorHandoff";
