import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  compareRuns,
  getRunPipelineTimeline,
  getRunStageTimeline,
} from "@/lib/api";
import { loadProjectRunsForRunDetailDeferred } from "./load-project-runs-for-run-detail-deferred";
import { deriveChangesSinceLastReviewCopy } from "@/lib/changes-since-last-review-summary";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { findPriorCommittedRun } from "@/lib/find-prior-committed-run";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { coerceRunComparison } from "@/lib/operator-response-guards";
import { tryStaticDemoPipelineTimeline } from "@/lib/operator-static-demo";
import { resolveRunDetailSavingsSummary } from "@/lib/run-detail-savings-summary-resolve";
import { isTimelineMilestoneEvent } from "@/lib/timeline-milestone-events";
import type { ArtifactDescriptor, PipelineTimelineItem, RunDetail, RunSummary } from "@/types/authority";
import type { StageTimelineSummary } from "@/types/stage-timeline";

import type {
  RunDetailBelowFoldDeferredModel,
  RunDetailMidDeferredModel,
} from "./run-detail-deferred-model";
import type { RunDetailChangesSinceLastReviewBanner } from "./run-detail-page-model";

type RunDetailDeferredLoadContext = {
  readonly routeRunId: string;
  readonly resolvedDetail: RunDetail;
  readonly usedStaticDemoRun: boolean;
  readonly buyerPolishedArtifactTable: boolean;
  readonly manifestId: string | undefined | null;
  readonly artifacts: ArtifactDescriptor[];
};

/** Loads compare banner and savings data after first-screen critical model is ready. */
export async function loadRunDetailMidDeferredModel(
  context: RunDetailDeferredLoadContext,
): Promise<RunDetailMidDeferredModel> {
  // Independent proxy hops — parallelize to avoid stacking RTTs (TB-2027).
  const [changesSinceLastReviewBanner, savingsSummary] = await Promise.all([
    loadChangesSinceLastReviewBanner(context),
    resolveRunDetailSavingsSummary({
      resolvedDetail: context.resolvedDetail,
      usedStaticDemoRun: context.usedStaticDemoRun,
      artifacts: context.artifacts,
      manifestId: context.manifestId,
      routeRunId: context.routeRunId,
    }),
  ]);

  return {
    changesSinceLastReviewBanner,
    savingsSummary,
  };
}

/** Loads pipeline sections and project-run context for below-fold run detail sections. */
export async function loadRunDetailBelowFoldDeferredModel(
  context: RunDetailDeferredLoadContext,
): Promise<RunDetailBelowFoldDeferredModel> {
  // Independent fetches — keep parallel when a caller still wants one combined model.
  const [projectRunContext, pipelineSections] = await Promise.all([
    loadProjectRunContext(context),
    loadPipelineTimelineSections(context),
  ]);

  return {
    ...projectRunContext,
    ...pipelineSections,
  };
}

/** Pipeline timeline + stages for an independent below-fold Suspense boundary (TB-2026). */
export async function loadRunDetailBelowFoldPipelineModel(
  context: RunDetailDeferredLoadContext,
): Promise<
  Pick<
    RunDetailBelowFoldDeferredModel,
    "pipelineTimelineForUi" | "pipelineTimelineAllForPackageChanges" | "pipelineTimelineFailure" | "stageTimelineForUi"
  >
> {
  return loadPipelineTimelineSections(context);
}

/** Project-run context for graph/habit CTAs under a second Suspense boundary (TB-2026). */
export async function loadRunDetailBelowFoldProjectContextModel(
  context: RunDetailDeferredLoadContext,
): Promise<Pick<RunDetailBelowFoldDeferredModel, "canShowCompareReviewButton" | "architectureGraphTemporalMinUtc">> {
  return loadProjectRunContext(context);
}

async function loadChangesSinceLastReviewBanner(
  context: RunDetailDeferredLoadContext,
): Promise<RunDetailChangesSinceLastReviewBanner | null> {
  const manifestId = context.manifestId;

  if (manifestId === undefined || manifestId === null || manifestId.trim().length === 0) {
    return null;
  }

  if (context.buyerPolishedArtifactTable) {
    return null;
  }

  let priorCommittedRun: RunSummary | null = null;

  try {
    const projectRuns = await loadProjectRunsForRunDetailDeferred(context.resolvedDetail.run.projectId, 60);
    priorCommittedRun = findPriorCommittedRun(context.resolvedDetail.run.runId, projectRuns);
  } catch {
    return null;
  }

  if (priorCommittedRun === null) {
    return null;
  }

  try {
    const rawCompare: unknown = await compareRuns(priorCommittedRun.runId, context.resolvedDetail.run.runId);
    const coercedCmp = coerceRunComparison(rawCompare);

    if (!coercedCmp.ok) {
      return null;
    }

    const copy = deriveChangesSinceLastReviewCopy(coercedCmp.value);

    if (copy === null) {
      return null;
    }

    return {
      priorReviewDateLabel: formatInstantForLocale(priorCommittedRun.createdUtc),
      priorRunId: priorCommittedRun.runId,
      currentRunId: context.resolvedDetail.run.runId,
      copy,
    };
  } catch {
    return null;
  }
}

async function loadProjectRunContext(
  context: RunDetailDeferredLoadContext,
): Promise<Pick<RunDetailBelowFoldDeferredModel, "canShowCompareReviewButton" | "architectureGraphTemporalMinUtc">> {
  let canShowCompareReviewButton = false;
  let architectureGraphTemporalMinUtc = context.resolvedDetail.run.createdUtc;

  try {
    const projectRuns = await loadProjectRunsForRunDetailDeferred(context.resolvedDetail.run.projectId, 60);

    canShowCompareReviewButton = projectRuns.length >= 2;

    if (isBuyerPolishedOperatorShellEnv()) {
      canShowCompareReviewButton = false;
    }

    let minUtc: string | null = null;

    for (const run of projectRuns) {
      if (run.hasGraphSnapshot !== true) {
        continue;
      }

      if (minUtc === null || run.createdUtc < minUtc) {
        minUtc = run.createdUtc;
      }
    }

    if (minUtc !== null) {
      architectureGraphTemporalMinUtc = minUtc;
    }
  } catch {
    canShowCompareReviewButton = false;
  }

  return {
    canShowCompareReviewButton,
    architectureGraphTemporalMinUtc,
  };
}

async function loadPipelineTimelineSections(
  context: RunDetailDeferredLoadContext,
): Promise<
  Pick<
    RunDetailBelowFoldDeferredModel,
    "pipelineTimelineForUi" | "pipelineTimelineAllForPackageChanges" | "pipelineTimelineFailure" | "stageTimelineForUi"
  >
> {
  // Pipeline + stage timelines share a runId but do not depend on each other (TB-2027).
  const [pipelineSettled, stageSettled] = await Promise.all([
    loadPipelineTimelineOnly(context),
    loadStageTimelineOnly(context.routeRunId),
  ]);

  return {
    pipelineTimelineForUi: pipelineSettled.pipelineTimelineForUi,
    pipelineTimelineAllForPackageChanges: pipelineSettled.pipelineTimelineAllForPackageChanges,
    pipelineTimelineFailure: pipelineSettled.pipelineTimelineFailure,
    stageTimelineForUi: stageSettled,
  };
}

async function loadPipelineTimelineOnly(
  context: RunDetailDeferredLoadContext,
): Promise<
  Pick<RunDetailBelowFoldDeferredModel, "pipelineTimelineForUi" | "pipelineTimelineAllForPackageChanges" | "pipelineTimelineFailure">
> {
  let pipelineTimeline: PipelineTimelineItem[] | null = null;
  let pipelineTimelineFailure: ApiLoadFailureState | null = null;

  try {
    pipelineTimeline = await getRunPipelineTimeline(context.routeRunId);
  } catch (error) {
    pipelineTimelineFailure = toApiLoadFailure(error);

    if (context.usedStaticDemoRun) {
      const staticTimeline = tryStaticDemoPipelineTimeline(context.routeRunId);

      if (staticTimeline !== null && staticTimeline.length > 0) {
        pipelineTimeline = staticTimeline;
        pipelineTimelineFailure = null;
      }
    }
  }

  if (pipelineTimeline === null || pipelineTimeline.length === 0) {
    const staticTimeline = tryStaticDemoPipelineTimeline(context.routeRunId);

    if (staticTimeline !== null && staticTimeline.length > 0) {
      pipelineTimeline = staticTimeline;
      pipelineTimelineFailure = null;
    }
  }

  const pipelineTimelineForUi: PipelineTimelineItem[] | null = context.buyerPolishedArtifactTable
    ? pipelineTimeline?.filter((event) => isTimelineMilestoneEvent(event.eventType)) ?? null
    : pipelineTimeline;

  return {
    pipelineTimelineForUi,
    pipelineTimelineAllForPackageChanges: pipelineTimeline,
    pipelineTimelineFailure,
  };
}

async function loadStageTimelineOnly(routeRunId: string): Promise<StageTimelineSummary[]> {
  try {
    const stageTimelineRaw = await getRunStageTimeline(routeRunId);

    return Array.isArray(stageTimelineRaw) ? stageTimelineRaw : [];
  } catch {
    return [];
  }
}
