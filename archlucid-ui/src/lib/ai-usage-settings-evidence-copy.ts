import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const AI_USAGE_SETTINGS_CANONICAL_PATH = AI_USAGE_SETTINGS_PATH;

export const AI_USAGE_HELP_TOPIC_LABEL = "How AI usage and cost work";

export const AI_USAGE_SETTINGS_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const AI_USAGE_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const AI_USAGE_SETTINGS_CLAIM_HEADING_ID = "ai-usage-settings-claim-discipline-heading" as const;

export const AI_USAGE_SETTINGS_CLAIM_DISCIPLINE =
  "This AI usage and cost page shows estimated spend and budget signals for the workspace - it is not invoice-accurate financial reporting, a sealed-review diligence Sources package. Open Billing & plans, Pilot ROI model, or Audit when you need plan controls, methodology, or governed trails.";

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
