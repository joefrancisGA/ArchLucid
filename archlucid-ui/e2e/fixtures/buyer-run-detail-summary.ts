import type { RunDetail } from "@/types/authority";

/** Mirrors `RunDetailBuyerMapper` — buyer-summary must not ship snapshot subgraphs or agent results. */
export function toMockBuyerRunDetailSummary(full: RunDetail): RunDetail {
  const {
    results: _results,
    contextSnapshot: _contextSnapshot,
    graphSnapshot: _graphSnapshot,
    findingsSnapshot: _findingsSnapshot,
    goldenManifest: _goldenManifest,
    artifactBundle: _artifactBundle,
    decisionTrace: _decisionTrace,
    ...buyerSafe
  } = full;

  return buyerSafe;
}
