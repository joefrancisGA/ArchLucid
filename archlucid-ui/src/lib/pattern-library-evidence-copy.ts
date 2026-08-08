import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PATTERN_LIBRARY_CLAIM_DISCIPLINE =
  "Pattern library cards are anonymized, thresholded aggregates (or labeled sample catalog data) — not a signed-review diligence Sources package and not tenant-identifying usage. Open Reviews or a pattern detail before briefing sponsors. Do not imply CPA SOC 2 attestation or a published third-party pen test from this page.";

export const PATTERN_LIBRARY_SOURCES_INTRO =
  "Browse patterns below, then open Reviews, Evidence trail, or Getting started when you need orientation before treating catalog signals as authoritative.";

export type PatternLibrarySourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to the patterns hub. */
export const PATTERN_LIBRARY_SOURCES: readonly PatternLibrarySourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Evidence trail", href: "/insights/evidence-graph" },
  { label: "Compare two reviews", href: "/insights/compare-two-reviews" },
  { label: "Impact preview", href: "/insights/impact-preview" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;

export const PATTERN_LIBRARY_CANONICAL_PATH = PATTERN_LIBRARY_PATH;
