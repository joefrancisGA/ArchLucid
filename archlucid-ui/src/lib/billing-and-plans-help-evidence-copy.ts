import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const BILLING_AND_PLANS_HELP_CANONICAL_PATH = "/help/billing-and-plans" as const;

export const BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE =
  "This billing guide orients architects on plans, usage, and invoices — it is not a signed-review diligence Sources package. Open Billing settings, Pricing, or Audit when you need live subscription controls or governed trails.";

export const BILLING_AND_PLANS_HELP_SOURCES_INTRO =
  "Use these follow-ups when plan questions turn into workspace billing controls, public packaging, or first-run orientation.";


/** Operator Sources — no self-href to `/help/billing-and-plans`. */
export const BILLING_AND_PLANS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Billing settings", href: "/administration/billing" },
  { label: "Pricing", href: "/pricing" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
