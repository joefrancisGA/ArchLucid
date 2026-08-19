import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  REVIEWS_NEW_DETAILED_HREF,
  REVIEWS_NEW_GUIDED_INTAKE_HREF,
  REVIEWS_NEW_QUICK_REVIEW_HREF,
} from "@/lib/reviews-new-path-copy";

export const REVIEWS_NEW_CLAIM_DISCIPLINE =
  "Starting a review captures your architecture context for analysis — not a sealed-review diligence Sources trail.";

export const REVIEWS_NEW_SOURCES_INTRO =
  "Choose a start path below, or open Reviews and the first-review guide when you need orientation before submitting.";

export const REVIEWS_NEW_FOLLOW_UPS_TITLE = "Where to go next";

/** Operator Sources — no self-href to `/architecture/reviews/new`. */
export const REVIEWS_NEW_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "First review guide", href: "/architecture/first-review-guide" },
  { label: "Review guide help", href: inAppHelpHref("review-guide") },
  { label: "Submit evidence help", href: inAppHelpHref("evidence-intake") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const REVIEWS_NEW_CANONICAL_PATH = "/architecture/reviews/new" as const;

const REVIEWS_NEW_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  "/architecture/reviews",
  REVIEWS_NEW_QUICK_REVIEW_HREF,
  REVIEWS_NEW_GUIDED_INTAKE_HREF,
  REVIEWS_NEW_DETAILED_HREF,
  inAppHelpHref("review-guide"),
  inAppHelpHref("evidence-intake"),
]);

/** Orientation-strip Sources — excludes path tabs and contextual-help topics surfaced on-page. */
export const REVIEWS_NEW_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = REVIEWS_NEW_SOURCES.filter(
  (source) => !REVIEWS_NEW_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
);
