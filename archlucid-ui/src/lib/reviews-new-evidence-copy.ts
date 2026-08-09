import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const REVIEWS_NEW_CLAIM_DISCIPLINE =
  "Starting a review captures your architecture context for analysis — not a signed-review diligence Sources trail.";

export const REVIEWS_NEW_SOURCES_INTRO =
  "Choose a start path below, or open Reviews and the first-review guide when you need orientation before submitting.";

export type ReviewsNewSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/architecture/reviews/new`. */
export const REVIEWS_NEW_SOURCES: readonly ReviewsNewSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "First review guide", href: "/architecture/first-review-guide" },
  { label: "Review guide help", href: inAppHelpHref("review-guide") },
  { label: "Submit evidence help", href: inAppHelpHref("evidence-intake") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const REVIEWS_NEW_CANONICAL_PATH = "/architecture/reviews/new" as const;
