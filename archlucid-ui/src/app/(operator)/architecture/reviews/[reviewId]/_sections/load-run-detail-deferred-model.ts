import { loadRunDetailPipelineTimelineCached } from "./load-run-detail-pipeline-timeline-cached";
import { loadRunDetailWorkspaceContextBundleCached } from "./load-run-detail-workspace-context-bundle-cached";
import { deriveChangesSinceLastReviewCopy } from "@/lib/changes-since-last-review-summary";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { coerceRunComparison } from "@/lib/operator/operator-response-guards";
import { resolveRunDetailSavingsSummary } from "@/lib/runs/run-detail-savings-summary-resolve";
import type { ArtifactDescriptor, RunDetail } from "@/types/authority";

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

  try {
    const workspaceContext = await loadRunDetailWorkspaceContextBundleCached(context.routeRunId);

    if (
      workspaceContext.priorCommittedRunComparison === null
      || workspaceContext.priorCommittedRunId === null
      || workspaceContext.priorCommittedRunCreatedUtc === null
    ) {
      return null;
    }

    const coercedCmp = coerceRunComparison(workspaceContext.priorCommittedRunComparison);

    if (!coercedCmp.ok) {
      return null;
    }

    const copy = deriveChangesSinceLastReviewCopy(coercedCmp.value);

    if (copy === null) {
      return null;
    }

    return {
      priorReviewDateLabel: formatInstantForLocale(workspaceContext.priorCommittedRunCreatedUtc),
      priorRunId: workspaceContext.priorCommittedRunId,
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
    const workspaceContext = await loadRunDetailWorkspaceContextBundleCached(context.routeRunId);
    const projectRuns = workspaceContext.recentProjectRuns;

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
  return loadRunDetailPipelineTimelineCached(
    context.routeRunId,
    context.usedStaticDemoRun,
    context.buyerPolishedArtifactTable,
  );
}
