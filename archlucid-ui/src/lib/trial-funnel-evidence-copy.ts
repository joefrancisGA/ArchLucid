import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const TRIAL_FUNNEL_CANONICAL_PATH = "/admin/trial-funnel" as const;

export const TRIAL_FUNNEL_CLAIM_DISCIPLINE =
  "Trial funnel metrics summarize trial-stage conversion for internal operators — they are operational KPI signals, not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Tenant health, Billing settings, or Audit when you need engagement, plan, or governed trails.";

export const TRIAL_FUNNEL_SOURCES_INTRO =
  "Use these follow-ups when funnel stages need engagement checks, billing conversion, cost pressure, or assurance orientation.";

export type TrialFunnelSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/admin/trial-funnel`. */
export const TRIAL_FUNNEL_SOURCES: readonly TrialFunnelSourceLink[] = [
  { label: "Tenant health", href: "/admin/tenant-health" },
  { label: "AI usage", href: "/administration/ai-usage" },
  { label: "Billing settings", href: "/administration/billing" },
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
  { label: "Audit", href: "/governance/audit" },
] as const;
