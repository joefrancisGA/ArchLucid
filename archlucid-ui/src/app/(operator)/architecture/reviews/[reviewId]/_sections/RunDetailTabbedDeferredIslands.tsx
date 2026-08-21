import { Suspense } from "react";

import { loadRunDetailBelowFoldProjectContextModel } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/load-run-detail-deferred-model";
import type {
  RunDetailDeferredSectionContext,
  RunDetailPageModel,
} from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/run-detail-page-model";
import { RunDetailBelowFoldProjectContextSkeleton } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailDeferredSkeleton";

import {
  RunDetailArchitectureGraphSectionDeferred,
  RunDetailPostCommitHabitLoopCardDeferred,
} from "./run-detail-tabbed-deferred-chunks";

type TabbedDeferredIslandProps = {
  readonly model: RunDetailPageModel;
  readonly context: RunDetailDeferredSectionContext;
};

async function RunDetailArchitectureGraphIslandAsync(
  props: TabbedDeferredIslandProps,
): Promise<React.JSX.Element | null> {
  const m = props.model;

  if (!m.resolvedDetail.run.graphSnapshotId) {
    return null;
  }

  const projectContext = await loadRunDetailBelowFoldProjectContextModel(props.context);

  return (
    <RunDetailArchitectureGraphSectionDeferred
      runId={m.routeRunId}
      buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
      anchorRunCreatedUtc={m.resolvedDetail.run.createdUtc}
      graphHistoryMinCreatedUtc={projectContext.architectureGraphTemporalMinUtc}
      disableTemporalBrowsing={m.usedStaticDemoRun}
    />
  );
}

async function RunDetailPostCommitHabitIslandAsync(
  props: TabbedDeferredIslandProps,
): Promise<React.JSX.Element | null> {
  const m = props.model;

  if (!m.manifestId) {
    return null;
  }

  const projectContext = await loadRunDetailBelowFoldProjectContextModel(props.context);

  return (
    <RunDetailPostCommitHabitLoopCardDeferred
      runId={m.routeRunId}
      showCompareCta={projectContext.canShowCompareReviewButton}
      buyerShowcaseQuickLinks={m.usedStaticDemoRun}
      goldenManifestId={m.manifestId}
      pagePrimaryOwnedElsewhere
    />
  );
}

export function RunDetailArchitectureGraphIsland(props: TabbedDeferredIslandProps): React.JSX.Element {
  return (
    <Suspense fallback={<RunDetailBelowFoldProjectContextSkeleton />}>
      <RunDetailArchitectureGraphIslandAsync model={props.model} context={props.context} />
    </Suspense>
  );
}

export function RunDetailPostCommitHabitIsland(props: TabbedDeferredIslandProps): React.JSX.Element {
  return (
    <Suspense fallback={<RunDetailBelowFoldProjectContextSkeleton />}>
      <RunDetailPostCommitHabitIslandAsync model={props.model} context={props.context} />
    </Suspense>
  );
}
