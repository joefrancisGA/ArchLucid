import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const REVIEWS_NEW_CLAIM_DISCIPLINE =
  "Starting a review captures intake for analysis — not a signed-review diligence Sources trail. Do not imply CPA SOC 2 attestation or a published third-party pen test from this page.";

export const REVIEWS_NEW_SOURCES_INTRO =
  "Choose an intake path below, or open Reviews and the first-review guide when you need orientation before submitting.";

export type ReviewsNewSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/architecture/reviews/new`. */
export const REVIEWS_NEW_SOURCES: readonly ReviewsNewSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "First review guide", href: "/architecture/first-review-guide" },
  { label: "Review guide help", href: inAppHelpHref("review-guide") },
  { label: "Evidence intake help", href: inAppHelpHref("evidence-intake") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const REVIEWS_NEW_CANONICAL_PATH = "/architecture/reviews/new" as const;
