import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const REVIEW_GUIDE_HELP_CANONICAL_PATH = "/help/review-guide" as const;

export const REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE =
  "This review guide is operator field reference for the architecture review wizard — it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Reviews, Findings, or Audit when you need live packages or governed trails.";

export const REVIEW_GUIDE_HELP_SOURCES_INTRO =
  "Use these follow-ups when field reference turns into starting a review, first-run onboarding, or findings triage.";

export type ReviewGuideHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/review-guide`. */
export const REVIEW_GUIDE_HELP_SOURCES: readonly ReviewGuideHelpSourceLink[] = [
  { label: "Start a review", href: "/reviews/new" },
  { label: "First review guide", href: FIRST_REVIEW_GUIDE_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Findings help", href: inAppHelpHref("findings") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
