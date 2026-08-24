import {
  CLOUD_CONNECTIONS_HELP_PATH,
  CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS,
} from "@/lib/cloud-connections-help-guide-content";

export type ReviewsNewPathMode = "quick-review" | "guided-intake" | "detailed";

/** Deep link for born-governed creation intake (guided clarifying questions). */
export const REVIEWS_NEW_GUIDED_INTAKE_HREF = "/architecture/reviews/new?path=guided-intake" as const;

/** URL path query token for the Guided questions tab (product label: {@link REVIEWS_NEW_GUIDED_QUESTIONS_LABEL}). */
export const REVIEWS_NEW_GUIDED_INTAKE_PATH_TOKEN = "guided-intake";

/** Deep link for templates / imports detailed wizard path. */
export const REVIEWS_NEW_DETAILED_HREF = "/architecture/reviews/new?path=detailed" as const;

/** Product tab label on `/architecture/reviews/new` path switcher (path query token: `detailed`). */
export const REVIEWS_NEW_TEMPLATES_AND_IMPORTS_TAB_LABEL = "Templates and imports";

/** URL path query token for the Templates and imports tab (product label: {@link REVIEWS_NEW_TEMPLATES_AND_IMPORTS_TAB_LABEL}). */
export const REVIEWS_NEW_DETAILED_PATH_TOKEN = "detailed";

/** Product tab label on `/architecture/reviews/new` path switcher (path query token: `quick-review`). */
export const REVIEWS_NEW_QUICK_START_TAB_LABEL = "Quick start";

/** URL path query token for the Quick start tab (product label: {@link REVIEWS_NEW_QUICK_START_TAB_LABEL}). */
export const REVIEWS_NEW_QUICK_REVIEW_PATH_TOKEN = "quick-review";

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
    "Start from a template or import, then attach evidence and complete configuration before you start the review.",
};

/** First-run progressive disclosure — secondary creation paths (TB-2130). */
export const REVIEWS_NEW_MORE_WAYS_TO_START_TITLE = "More ways to start";

export const REVIEWS_NEW_MORE_WAYS_TO_START_SUMMARY =
  "Guided questions or templates and imports when you need more control.";

export const REVIEWS_NEW_BACK_TO_QUICK_START_CTA = "Back to quick start";

/**
 * Actionable follow-up when the page lead notes cloud connections are optional.
 * Help covers Tier 1 inventory ZIP upload and Tier 2 hosted connectors; hub is where connectors are created.
 */
export const REVIEWS_NEW_OPTIONAL_CLOUD_LEAD =
  "For read-only AWS, Azure, or GCP inventory, connect a cloud environment or upload an inventory ZIP when you attach evidence — you can also add cloud evidence from the review detail page after the review starts.";

export const REVIEWS_NEW_CLOUD_CONNECTIONS_HELP_LINK_LABEL = "How cloud connections work";

export const REVIEWS_NEW_CLOUD_CONNECTIONS_HUB_LINK_LABEL =
  CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.label;

export const REVIEWS_NEW_CLOUD_CONNECTIONS_HELP_HREF = CLOUD_CONNECTIONS_HELP_PATH;

export const REVIEWS_NEW_CLOUD_CONNECTIONS_HUB_HREF = CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.href;

/** Proof collection reminder after finalize (technical script path retained). */
export const REVIEWS_NEW_PROOF_COLLECTION_HINT =
  "After finalize, collect buyer-safe proof: .\\scripts\\collect-first-pilot-proof.ps1 -RunId <review-id> -SponsorHandoff";
