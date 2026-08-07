import { ARCHITECTURES_LIST_PATH, ARCHITECTURES_NEW_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture-routes";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ARCHITECTURES_LIST_CANONICAL_PATH = ARCHITECTURES_LIST_PATH;

export const ARCHITECTURES_LIST_CLAIM_DISCIPLINE =
  "The architectures list is draft inventory only - opening or filtering drafts does not start a review, and this page is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Use Create architecture or Start a review when you are ready to draft or file evidence.";

export const ARCHITECTURES_LIST_SOURCES_INTRO =
  "Use these follow-ups when inventory leads to create-bootstrap, a saved draft, review intake, or first-run orientation.";

export type ArchitecturesListSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to `/architecture/architectures`. */
export const ARCHITECTURES_LIST_SOURCES: readonly ArchitecturesListSourceLink[] = [
  { label: "Create architecture", href: ARCHITECTURES_NEW_PATH },
  { label: "Start a review", href: REVIEWS_NEW_PATH },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Evidence intake help", href: inAppHelpHref("evidence-intake") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
