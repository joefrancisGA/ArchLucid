import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  compareRuns,
  getRunPipelineTimeline,
  getRunStageTimeline,
  listRunsByProject,
} from "@/lib/api";
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
  const changesSinceLastReviewBanner = await loadChangesSinceLastReviewBanner(context);
  const savingsSummary = await resolveRunDetailSavingsSummary({
    resolvedDetail: context.resolvedDetail,
    usedStaticDemoRun: context.usedStaticDemoRun,
    artifacts: context.artifacts,
    manifestId: context.manifestId,
    routeRunId: context.routeRunId,
  });

  return {
    changesSinceLastReviewBanner,
    savingsSummary,
  };
}

/** Loads pipeline sections and project-run context for below-fold run detail sections. */
export async function loadRunDetailBelowFoldDeferredModel(
  context: RunDetailDeferredLoadContext,
): Promise<RunDetailBelowFoldDeferredModel> {
  const projectRunContext = await loadProjectRunContext(context);
  const pipelineSections = await loadPipelineTimelineSections(context);

  return {
    ...projectRunContext,
    ...pipelineSections,
  };
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
    const projectRuns = await listRunsByProject(context.resolvedDetail.run.projectId, 60);
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
    const projectRuns = await listRunsByProject(context.resolvedDetail.run.projectId, 60);

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
    "pipelineTimelineForUi" | "pipelineTimelineFailure" | "stageTimelineForUi"
  >
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

  let stageTimelineForUi: StageTimelineSummary[] = [];

  try {
    const stageTimelineRaw = await getRunStageTimeline(context.routeRunId);
    stageTimelineForUi = Array.isArray(stageTimelineRaw) ? stageTimelineRaw : [];
  } catch {
    stageTimelineForUi = [];
  }

  return {
    pipelineTimelineForUi,
    pipelineTimelineFailure,
    stageTimelineForUi,
  };
}
