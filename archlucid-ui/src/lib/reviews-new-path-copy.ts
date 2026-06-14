export type ReviewsNewPathMode = "quick-review" | "guided-intake" | "detailed";

/** Single-line example — sample brief button supplies the full narrative. */
export const REVIEWS_NEW_BRIEF_PLACEHOLDER =
  "Example: Customer-facing retail API on Azure using App Service, Azure SQL, Redis, and private networking. Goals include PCI-sensitive payment isolation, 99.9% availability, EU data residency, and phased migration from an on-prem monolith.";

/** Mode-specific hint shown under the path tabs (one sentence per active mode). */
export const REVIEWS_NEW_PATH_HINTS: Record<ReviewsNewPathMode, string> = {
  "quick-review":
    "First Pilot path: create a review from a short brief, then execute and commit. Choose simulator for dry runs or live when real-mode proof is required.",
  "guided-intake":
    "Structured Pilot intake — clarifying questions and evidence checks before the review package is generated.",
  detailed:
    "Advanced path: imports, presets, and export-ready packages. Use after your first committed Pilot proof.",
};

/** First-session guidance shown on the new-review page. */
export const REVIEWS_NEW_FIRST_SESSION_GUIDANCE =
  "Your first session: Create review → Execute → Commit → Sponsor packet. Operate surfaces (compare, replay, governance) stay hidden until after commit — Help → Pilot path.";

/** Proof collection reminder after commit (operator copy). */
export const REVIEWS_NEW_PROOF_COLLECTION_HINT =
  "After commit, collect buyer-safe proof: .\\scripts\\collect-first-pilot-proof.ps1 -RunId <review-id> -SponsorHandoff";
