import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const PATTERN_LIBRARY_DETAIL_CLAIM_DISCIPLINE =
  "Pattern detail copy is anonymized catalog guidance (or labeled sample data) — not live tenant usage or a full audit export. Open the Pattern library or start a review before briefing sponsors.";

export const PATTERN_LIBRARY_DETAIL_CLAIM_HEADING = "Anonymized pattern detail only" as const;

export const PATTERN_LIBRARY_DETAIL_PATTERN_KEY_LABEL = "Pattern key" as const;

export const PATTERN_LIBRARY_DETAIL_SOURCES_INTRO =
  "Use this pattern as a starting point, then open the Pattern library, Reviews, or Getting started when you need orientation before treating catalog signals as authoritative.";


/** Operator Sources — no self-href to the dynamic pattern detail path. */
export const PATTERN_LIBRARY_DETAIL_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Pattern library", href: PATTERN_LIBRARY_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Evidence trail", href: "/insights/evidence-graph" },
  { label: "Compare two reviews", href: "/insights/compare-two-reviews" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;

/** Workbook path pattern for INA (dynamic pattern key). */
export const PATTERN_LIBRARY_DETAIL_WORKBOOK_PATH = "/insights/patterns/[patternKey]" as const;
