import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PRICING_CANONICAL_PATH = "/pricing" as const;

export const PRICING_CLAIM_DISCIPLINE =
  "Tier cards and quote requests describe commercial packaging and trial access — they are not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Assurance status or the Trust Center before treating assurance language as procurement evidence.";

export const PRICING_SOURCES_INTRO =
  "Use these evaluation links when pricing questions turn into security, packaging, or pilot-scope follow-ups.";

export type PricingSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Marketing Sources — no self-href to /pricing. */
export const PRICING_SOURCES: readonly PricingSourceLink[] = [
  { label: "Product FAQ", href: "/faq" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Trust Center", href: "/trust" },
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
] as const;
