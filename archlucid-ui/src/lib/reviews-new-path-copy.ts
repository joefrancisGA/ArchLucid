export type ReviewsNewPathMode = "quick-review" | "guided-intake" | "detailed";

/** Single-line example — sample brief button supplies the full narrative. */
export const REVIEWS_NEW_BRIEF_PLACEHOLDER =
  "Example: Customer-facing retail API on Azure using App Service, Azure SQL, Redis, and private networking. Goals include PCI-sensitive payment isolation, 99.9% availability, EU data residency, and phased migration from an on-prem monolith.";

/** Mode-specific hint shown under the path tabs (one sentence per active mode). */
export const REVIEWS_NEW_PATH_HINTS: Record<ReviewsNewPathMode, string> = {
  "quick-review": "Creates a review from a short architecture brief.",
  "guided-intake":
    "Adds structured questions, required review checks, and an evidence trail before the review package is generated.",
  detailed: "Supports imports, presets, evidence upload, and export-ready packages.",
};
