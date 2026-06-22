export type ReviewsNewPathMode = "quick-review" | "guided-intake" | "detailed";

/** Single-line example — sample brief button supplies the full narrative. */
export const REVIEWS_NEW_BRIEF_PLACEHOLDER =
  "Example: Customer-facing retail API on Azure using App Service, Azure SQL, Redis, and private networking. Goals include PCI-sensitive payment isolation, 99.9% availability, EU data residency, and phased migration from an on-prem monolith.";

/** Mode-specific hint shown under the path tabs (one sentence per active mode). */
export const REVIEWS_NEW_PATH_HINTS: Record<ReviewsNewPathMode, string> = {
  "guided-intake":
    "This takes about 10 minutes and captures the system context needed for analysis.",
  "quick-review":
    "Paste a complete architecture brief to start analysis in a few minutes. Best when you already have a full description ready.",
  detailed:
    "Use templates, imports, and evidence upload when you need an export-ready review package with full configuration.",
};

/** Proof collection reminder after commit (operator copy). */
export const REVIEWS_NEW_PROOF_COLLECTION_HINT =
  "After commit, collect buyer-safe proof: .\\scripts\\collect-first-pilot-proof.ps1 -RunId <review-id> -SponsorHandoff";
