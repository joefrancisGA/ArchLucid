import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const TRIAL_FUNNEL_CANONICAL_PATH = "/internal/trial-funnel" as const;

export const TRIAL_FUNNEL_CLAIM_DISCIPLINE =
  "Trial funnel metrics summarize trial-stage conversion for internal administrators — they are operational KPI signals, not a signed-review diligence Sources package. Open Tenant health, Billing settings, or Audit when you need engagement, plan, or governed trails.";

export const TRIAL_FUNNEL_SOURCES_INTRO =
  "Use these follow-ups when funnel stages need engagement checks, billing conversion, cost pressure, or assurance orientation.";


/** Operator Sources — no self-href to `/internal/trial-funnel`. */
export const TRIAL_FUNNEL_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Tenant health", href: "/internal/tenant-health" },
  { label: "AI usage", href: "/administration/ai-usage" },
  { label: "Billing settings", href: "/administration/billing" },
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
  { label: "Audit", href: "/governance/audit" },
] as const;
