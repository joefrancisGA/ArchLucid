import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { INTERNAL_PRICING_QUOTE_AGING_PATH } from "@/lib/internal-ops-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const PRICING_QUOTE_AGING_CANONICAL_PATH = INTERNAL_PRICING_QUOTE_AGING_PATH;

export const PRICING_QUOTE_AGING_HELP_TOPIC_LABEL = "Pricing quote follow-up" as const;

export const PRICING_QUOTE_AGING_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const PRICING_QUOTE_AGING_FOLLOW_UPS_TITLE = "Where to go next";

export const PRICING_QUOTE_AGING_CLAIM_HEADING_ID = "pricing-quote-aging-claim-discipline-heading" as const;

export const PRICING_QUOTE_AGING_CLAIM_DISCIPLINE =
  "Pricing quote follow-up rows are internal sales-operations SLA and owner tracking for open quote requests — they are not invoices, signed commercial commitments, a sealed-review diligence Sources package. Open Billing or Trial funnel when you need commercial or conversion context.";

export const PRICING_QUOTE_AGING_SOURCES_INTRO =
  "Use these follow-ups when quote aging needs commercial packaging, trial conversion, or trust context.";


/** Operator Sources — no self-href to pricing-quote-aging. */
export const PRICING_QUOTE_AGING_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Billing & plans", href: "/administration/billing" },
  { label: "Trial funnel", href: "/internal/trial-funnel" },
  { label: "Pricing", href: "/pricing" },
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
  { label: "Tenant health", href: "/internal/tenant-health" },
] as const;
