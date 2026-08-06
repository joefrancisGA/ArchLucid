import { ARCHITECTURES_LIST_PATH, ARCHITECTURES_NEW_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture-routes";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ARCHITECTURES_NEW_CANONICAL_PATH = ARCHITECTURES_NEW_PATH;

export const ARCHITECTURES_NEW_CLAIM_DISCIPLINE =
  "Creating or saving an architecture draft does not start a review - this page is drafting-first bootstrap, not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Start a review or Evidence intake help when you are ready to file evidence.";

export const ARCHITECTURES_NEW_SOURCES_INTRO =
  "Use these follow-ups when a draft turns into review intake, first-run orientation, or the architectures list.";

export type ArchitecturesNewSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to `/architecture/architectures/new`. */
export const ARCHITECTURES_NEW_SOURCES: readonly ArchitecturesNewSourceLink[] = [
  { label: "Architectures", href: ARCHITECTURES_LIST_PATH },
  { label: "Start a review", href: REVIEWS_NEW_PATH },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Evidence intake help", href: inAppHelpHref("evidence-intake") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
