import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const SIGNUP_CANONICAL_PATH = "/signup" as const;

export const SIGNUP_CLAIM_DISCIPLINE =
  "Evaluation signup and access requests create a workspace for trying ArchLucid — they are not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Security & trust or Pricing before treating signup copy as procurement evidence.";

export const SIGNUP_SOURCES_INTRO =
  "Use these evaluation links when signup questions turn into packaging, assurance, or first-review follow-ups.";

export type SignupSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Marketing Sources — no self-href to /signup. */
export const SIGNUP_SOURCES: readonly SignupSourceLink[] = [
  { label: "Product FAQ", href: "/faq" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security & trust", href: "/security-trust" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
] as const;
