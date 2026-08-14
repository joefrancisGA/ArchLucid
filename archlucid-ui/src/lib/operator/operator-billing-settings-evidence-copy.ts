import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const OPERATOR_BILLING_SETTINGS_CANONICAL_PATH = "/administration/billing" as const;

export const OPERATOR_BILLING_SETTINGS_HELP_TOPIC_LABEL = "How billing and plans work" as const;

export const OPERATOR_BILLING_SETTINGS_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const OPERATOR_BILLING_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const OPERATOR_BILLING_SETTINGS_CLAIM_HEADING_ID = "operator-billing-settings-claim-discipline-heading" as const;

export const OPERATOR_BILLING_SETTINGS_CLAIM_DISCIPLINE =
  "This Billing & plans page shows workspace subscription, usage, and wallet controls - it is not a sealed-review diligence Sources package, financial reporting. Open Pricing, Billing help, or Audit when you need public packaging, methodology, or governed trails.";

export const OPERATOR_BILLING_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when plan or usage questions turn into public packaging, ROI methodology, AI spend controls, or invoice-oriented help.";


/** Operator Sources - no self-href to `/administration/billing`. */
export const OPERATOR_BILLING_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
  { label: "Pricing", href: "/pricing" },
  { label: "AI usage", href: "/administration/ai-usage" },
  { label: "Pilot ROI measurement", href: inAppHelpHref("sponsor-report", "pilot-roi-measurement") },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
] as const;
