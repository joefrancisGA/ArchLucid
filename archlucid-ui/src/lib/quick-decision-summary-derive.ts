export type { FindingWireSnapshot } from "@/lib/quick-decision-wire-snapshots";
export type { QuickDecisionFinding } from "@/lib/quick-decision-finding-extract";

export {
  firstRecommendationSentence,
  severityBadgeLabel,
  severityKindFromNumericValue,
  type FindingHumanReviewStatusDisplay,
  normalizeFindingHumanReviewStatus,
  humanReviewStatusDisplay,
  coerceArchitectureFindingSeverity,
} from "@/lib/quick-decision-severity-labels";

export {
  extractQuickDecisionFindingsFromRunDetail,
  isQuickDecisionDerivedFromExplanationTraces,
  resolveQuickDecisionFindingsForRunDetail,
  extractIacStubForFinding,
  findingHasNoSourceEvidence,
  sortQuickDecisionFindings,
  partitionQuickDecisionFindings,
  buildWorkspaceCardRenderedFindings,
} from "@/lib/quick-decision-finding-extract";

export {
  resolveFindingTraceRowsFromSummary,
  buildFindingWireSnapshotsByFindingId,
  buildFindingWireSnapshotsForRunDetail,
} from "@/lib/quick-decision-wire-snapshots";
