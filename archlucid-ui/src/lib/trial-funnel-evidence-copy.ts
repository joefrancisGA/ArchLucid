import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const TRIAL_FUNNEL_CANONICAL_PATH = "/internal/trial-funnel" as const;

export const TRIAL_FUNNEL_HELP_TOPIC_LABEL = "How the trial funnel works" as const;

export const TRIAL_FUNNEL_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const TRIAL_FUNNEL_FOLLOW_UPS_TITLE = "Where to go next";

export const TRIAL_FUNNEL_CLAIM_HEADING_ID = "trial-funnel-claim-discipline-heading" as const;

export const TRIAL_FUNNEL_CLAIM_DISCIPLINE =
  "Trial funnel metrics summarize trial-stage conversion for internal administrators — they are operational KPI signals, not a sealed-review diligence Sources package. Open Tenant health, Billing settings, or Audit when you need engagement, plan, or governed trails.";

export const TRIAL_FUNNEL_SOURCES_INTRO =
  "Use these follow-ups when funnel stages need engagement checks, billing conversion, cost pressure, or assurance orientation.";


/** Operator Sources — no self-href to `/internal/trial-funnel`. */
export const TRIAL_FUNNEL_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Tenant health", href: "/internal/tenant-health" },
  { label: "AI usage", href: "/administration/ai-usage" },
  { label: "Billing settings", href: "/administration/billing" },
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
] as const;
