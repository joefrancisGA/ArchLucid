import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH =
  "/administration/model-governance" as const;

export const MODEL_GOVERNANCE_HELP_TOPIC_LABEL = "How model governance works";

export const MODEL_GOVERNANCE_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const MODEL_GOVERNANCE_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when profile or alias changes turn into spend monitoring, plan controls, or assurance cites.";

/** Operator Sources - no self-href to `/administration/model-governance`. */
export const MODEL_GOVERNANCE_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "AI usage and cost", href: "/administration/ai-usage" },
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
  { label: "Billing & plans", href: "/administration/billing" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
