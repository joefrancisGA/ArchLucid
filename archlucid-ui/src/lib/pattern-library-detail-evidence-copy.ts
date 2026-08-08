import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PATTERN_LIBRARY_DETAIL_CLAIM_DISCIPLINE =
  "Pattern detail copy is anonymized catalog guidance (or labeled sample data) — not a signed-review diligence Sources package and not tenant-identifying usage. Open the Pattern library or start a review before briefing sponsors. Do not imply CPA SOC 2 attestation or a published third-party pen test from this page.";

export const PATTERN_LIBRARY_DETAIL_SOURCES_INTRO =
  "Use this pattern as a starting point, then open the Pattern library, Reviews, or Getting started when you need orientation before treating catalog signals as authoritative.";

export type PatternLibraryDetailSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to the dynamic pattern detail path. */
export const PATTERN_LIBRARY_DETAIL_SOURCES: readonly PatternLibraryDetailSourceLink[] = [
  { label: "Pattern library", href: PATTERN_LIBRARY_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Evidence trail", href: "/insights/evidence-graph" },
  { label: "Compare two reviews", href: "/insights/compare-two-reviews" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;

/** Workbook path pattern for INA (dynamic pattern key). */
export const PATTERN_LIBRARY_DETAIL_WORKBOOK_PATH = "/insights/patterns/[patternKey]" as const;
