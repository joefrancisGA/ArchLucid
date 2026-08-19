import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const AI_USAGE_SETTINGS_CANONICAL_PATH = AI_USAGE_SETTINGS_PATH;

export const AI_USAGE_HELP_TOPIC_LABEL = "How AI usage and cost work";

export const AI_USAGE_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const AI_USAGE_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when estimated spend turns into plan changes, ROI methodology, or budget edit controls on Billing.";

/** Operator Sources - no self-href to `/administration/ai-usage`. */
export const AI_USAGE_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Billing & plans", href: "/administration/billing" },
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
  { label: "Pilot ROI measurement", href: inAppHelpHref("sponsor-report", "pilot-roi-measurement") },
  { label: "Pricing", href: "/pricing" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
] as const;
