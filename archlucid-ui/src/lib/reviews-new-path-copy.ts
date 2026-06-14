export type ReviewsNewPathMode = "quick-review" | "guided-intake" | "detailed";

/** Single-line example — sample brief button supplies the full narrative. */
export const REVIEWS_NEW_BRIEF_PLACEHOLDER =
  "Example: Customer-facing retail API on Azure using App Service, Azure SQL, Redis, and private networking. Goals include PCI-sensitive payment isolation, 99.9% availability, EU data residency, and phased migration from an on-prem monolith.";

/** Mode-specific hint shown under the path tabs (one sentence per active mode). */
export const REVIEWS_NEW_PATH_HINTS: Record<ReviewsNewPathMode, string> = {
  "quick-review":
    "Pilot path: creates a review from a short brief. Choose simulator for dry runs or live when real-mode proof is required.",
  "guided-intake":
    "Structured Pilot intake — adds clarifying questions and evidence checks before the review package is generated.",
  detailed:
    "Advanced path: imports, presets, and export-ready packages. Use after your first committed Pilot proof.",
};

/** First-session guidance shown on the new-review page. */
export const REVIEWS_NEW_FIRST_SESSION_GUIDANCE =
  "Start here for your first Pilot proof. Operate surfaces (compare, replay, governance) unlock after commit — see Help → Pilot path.";

/** Proof collection reminder after commit (operator copy). */
export const REVIEWS_NEW_PROOF_COLLECTION_HINT =
  "After commit, run .\\scripts\\collect-first-pilot-proof.ps1 -RunId <id> -SponsorHandoff for buyer-safe evidence.";
