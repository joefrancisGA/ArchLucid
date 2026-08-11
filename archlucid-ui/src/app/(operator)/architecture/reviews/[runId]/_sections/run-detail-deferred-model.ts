import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { RunSavingsSummaryModel } from "@/lib/run-savings-summary-model";
import type { PipelineTimelineItem } from "@/types/authority";
import type { StageTimelineSummary } from "@/types/stage-timeline";

import type { RunDetailChangesSinceLastReviewBanner } from "./run-detail-page-model";

/** Mid-page deferred fetches: compare banner and savings summary. */
export type RunDetailMidDeferredModel = {
  readonly changesSinceLastReviewBanner: RunDetailChangesSinceLastReviewBanner | null;
  readonly savingsSummary: RunSavingsSummaryModel | null;
};

/** Below-fold deferred fetches: pipeline timelines and project-run context. */
export type RunDetailBelowFoldDeferredModel = {
  readonly pipelineTimelineForUi: PipelineTimelineItem[] | null;
  /** Unfiltered pipeline feed for TB-2200 post-finalize package changes. */
  readonly pipelineTimelineAllForPackageChanges: PipelineTimelineItem[] | null;
  readonly pipelineTimelineFailure: ApiLoadFailureState | null;
  readonly stageTimelineForUi: StageTimelineSummary[];
  readonly canShowCompareReviewButton: boolean;
  readonly architectureGraphTemporalMinUtc: string;
};
