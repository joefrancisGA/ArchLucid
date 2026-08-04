import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const SIGNUP_VERIFY_CANONICAL_PATH = "/signup/verify" as const;

export const SIGNUP_VERIFY_CLAIM_DISCIPLINE =
  "Email verification continues evaluation workspace setup — it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Security & trust or Pricing before treating verification copy as procurement evidence.";

export const SIGNUP_VERIFY_SOURCES_INTRO =
  "Use these evaluation links when verification questions turn into signup restart, packaging, or first-run follow-ups.";

export type SignupVerifySourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Marketing Sources — no self-href to `/signup/verify`. */
export const SIGNUP_VERIFY_SOURCES: readonly SignupVerifySourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security & trust", href: "/security-trust" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
