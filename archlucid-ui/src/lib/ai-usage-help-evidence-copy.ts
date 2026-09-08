import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const AI_USAGE_HELP_CANONICAL_PATH = "/help/ai-usage" as const;

export const AI_USAGE_HELP_CLAIM_DISCIPLINE_HEADING = "What AI usage is not";

export const AI_USAGE_HELP_CLAIM_DISCIPLINE =
  "This guide explains workspace AI usage and cost signals for directional operations telemetry. It is not invoice-accurate financial reporting or a full audit export.";

export const AI_USAGE_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const AI_USAGE_HELP_SOURCES_INTRO =
  "Use these follow-ups when estimated spend turns into billing controls, execution profiles, or activity records.";

/** Operator Sources — no self-href to the AI usage settings surface or tile-covered destinations. */
export const AI_USAGE_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Billing and plans", href: "/administration/billing" },
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
  { label: "Model policy", href: "/administration/model-governance" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
] as const;
