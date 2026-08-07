import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const BILLING_AND_PLANS_HELP_CANONICAL_PATH = "/help/billing-and-plans" as const;

export const BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE =
  "This billing guide orients operators on plans, usage, and invoices — it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Billing settings, Pricing, or Audit when you need live subscription controls or governed trails.";

export const BILLING_AND_PLANS_HELP_SOURCES_INTRO =
  "Use these follow-ups when plan questions turn into workspace billing controls, public packaging, or first-run orientation.";

export type BillingAndPlansHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/billing-and-plans`. */
export const BILLING_AND_PLANS_HELP_SOURCES: readonly BillingAndPlansHelpSourceLink[] = [
  { label: "Billing settings", href: "/administration/billing" },
  { label: "Pricing", href: "/pricing" },
  { label: "Audit", href: "/governance/audit" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
