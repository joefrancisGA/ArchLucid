import type { RunDetailSection } from "@/components/RunDetailSectionNav";
import type { AdrGeneratorRunInput } from "@/lib/adr-from-run";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { ChangesSinceLastReviewCopy } from "@/lib/changes-since-last-review-summary";
import type { FindingWireSnapshot, QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { ArtifactDescriptor, ManifestSummary, PipelineTimelineItem, RunDetail, RunSummary } from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";

export type RunDetailChangesSinceLastReviewBanner = {
  readonly priorReviewDateLabel: string;
  readonly priorRunId: string;
  readonly currentRunId: string;
  readonly copy: ChangesSinceLastReviewCopy;
};

/** Server-shaped bundle passed from `loadRunDetailPageModel` into `RunDetailPageView`. */
export type RunDetailPageModel = {
  readonly routeRunId: string;
  readonly resolvedDetail: RunDetail;
  readonly runDetailTraceId: string | null;
  readonly buyerPolishedArtifactTable: boolean;
  readonly usedStaticDemoRun: boolean;
  readonly manifestId: string | undefined | null;
  readonly headline: string;
  readonly createdLabel: string;
  readonly canShowCompareReviewButton: boolean;
  readonly changesSinceLastReviewBanner: RunDetailChangesSinceLastReviewBanner | null;
  readonly goldenManifestJsonForExport: unknown | null;
  readonly progressForPipelineUi: RunSummary;
  readonly showProgressTracker: boolean;
  readonly manifestSummary: ManifestSummary | null;
  readonly manifestSummaryForUi: ManifestSummary | null;
  readonly manifestSummaryFailure: ApiLoadFailureState | null;
  readonly manifestSummaryMalformed: string | null;
  readonly artifacts: ArtifactDescriptor[];
  readonly artifactsFailure: ApiLoadFailureState | null;
  readonly artifactsMalformed: string | null;
  readonly explanationSummary: RunExplanationSummary | null;
  readonly explanationFailure: ApiLoadFailureState | null;
  readonly pipelineTimelineForUi: PipelineTimelineItem[] | null;
  readonly pipelineTimelineFailure: ApiLoadFailureState | null;
  readonly runDetailNavSections: RunDetailSection[];
  readonly findingCountDisplay: number | null;
  readonly warningCountDisplay: number | null;
  readonly showPilotScorecardPackageCta: boolean;
  readonly governanceGateLabel: string | null;
  readonly quickDecisionFindings: QuickDecisionFinding[];
  readonly findingWireSnapshots: Record<string, FindingWireSnapshot>;
  readonly adrGeneratorInput: AdrGeneratorRunInput;
};
