import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH =
  "/administration/model-governance" as const;

/** Buyer-facing Administration label for the workspace model policy page (route unchanged). */
export const AI_MODELS_SETTINGS_ADMIN_NAV_LABEL = "AI models" as const;

export const AI_MODELS_SETTINGS_PAGE_TITLE = "AI models" as const;

export const AI_MODELS_SETTINGS_PAGE_SUBTITLE =
  "See which models run each review task and manage the workspace execution profile and allowed models." as const;

export const AI_MODELS_SETTINGS_CANONICAL_PATH = MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH;

export const AI_MODELS_SETTINGS_OPEN_CTA_LABEL = "Open AI models" as const;

export const MODEL_GOVERNANCE_HELP_TOPIC_LABEL = "How model policy works";

export const MODEL_GOVERNANCE_SETTINGS_CLAIM_DISCIPLINE_HEADING = "What AI models is not";

export const MODEL_GOVERNANCE_SETTINGS_CLAIM_DISCIPLINE =
  "Workspace execution profiles and allowed models on this page configure review tasks — they are not a sealed audit export or third-party model certification.";

export const MODEL_GOVERNANCE_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const MODEL_GOVERNANCE_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when profile or alias changes turn into spend monitoring, plan controls, or official assurance materials.";

/** Operator Sources - no self-href to `/administration/model-governance`. */
export const MODEL_GOVERNANCE_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "AI usage and cost", href: "/administration/ai-usage" },
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
  { label: "Billing & plans", href: "/administration/billing" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
