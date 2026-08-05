import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GET_STARTED_CANONICAL_PATH = "/get-started" as const;

export const GET_STARTED_CLAIM_DISCIPLINE =
  "This get-started page orients buyers toward a guided trial or illustrative sample review — it is marketing first-run orientation, not a signed-review diligence Sources package from your tenant, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Security & trust or start an evaluation when you need live workspace evidence.";

export const GET_STARTED_SOURCES_INTRO =
  "Use these evaluation links when path selection turns into signup, assurance, or product orientation.";

export type GetStartedSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Marketing Sources — no self-href to `/get-started`. */
export const GET_STARTED_SOURCES: readonly GetStartedSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Security & trust", href: "/security-trust" },
  { label: "Trust Center", href: "/trust" },
  { label: "Getting started help", href: inAppHelpHref("getting-started") },
] as const;
