import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const FAQ_CANONICAL_PATH = "/faq" as const;

export const FAQ_CLAIM_DISCIPLINE =
  "Product FAQ answers are evaluation orientation for architects and sponsors — they are not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Assurance status or Pricing before treating FAQ copy as procurement evidence.";

export const FAQ_SOURCES_INTRO =
  "Use these evaluation links when FAQ answers turn into packaging, assurance, signup, or first-review follow-ups.";

export type FaqSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Marketing Sources — no self-href to /faq. */
export const FAQ_SOURCES: readonly FaqSourceLink[] = [
  { label: "Pricing", href: "/pricing" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Start evaluation", href: "/signup" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
] as const;
