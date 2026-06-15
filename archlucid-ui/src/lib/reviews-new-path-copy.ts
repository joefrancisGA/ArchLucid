export type ReviewsNewPathMode = "quick-review" | "guided-intake" | "detailed";

/** Single-line example — sample brief button supplies the full narrative. */
export const REVIEWS_NEW_BRIEF_PLACEHOLDER =
  "Example: Customer-facing retail API on Azure using App Service, Azure SQL, Redis, and private networking. Goals include PCI-sensitive payment isolation, 99.9% availability, EU data residency, and phased migration from an on-prem monolith.";

/** Mode-specific hint shown under the path tabs (one sentence per active mode). */
export const REVIEWS_NEW_PATH_HINTS: Record<ReviewsNewPathMode, string> = {
  "guided-intake":
    "Recommended naive-user path: guided intake → admitted draft → MUST questions → submit → spawned review → execute → commit.",
  "quick-review":
    "Advanced path: paste a long brief and start a review directly. Use after your first guided intake or when you already have a complete packet.",
  detailed:
    "Expert path: imports, presets, and export-ready packages. Use after your first committed Pilot proof.",
};

/** First-session guidance shown on the new-review page. */
export const REVIEWS_NEW_FIRST_SESSION_GUIDANCE =
  "Your first session: Guided intake → admitted draft → MUST questions → submit → spawned review → execute → commit → sponsor packet. Quick review and templates stay available as advanced paths.";

/** Proof collection reminder after commit (operator copy). */
export const REVIEWS_NEW_PROOF_COLLECTION_HINT =
  "After commit, collect buyer-safe proof: .\\scripts\\collect-first-pilot-proof.ps1 -RunId <review-id> -SponsorHandoff";
