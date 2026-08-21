import { Suspense } from "react";

import dynamic from "next/dynamic";

import { loadRunDetailBelowFoldProjectContextModel } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/load-run-detail-deferred-model";
import type {
  RunDetailDeferredSectionContext,
  RunDetailPageModel,
} from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/run-detail-page-model";
import { RunDetailBelowFoldProjectContextSkeleton } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailDeferredSkeleton";
import { loadDeferredChunkFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

const PostCommitHabitLoopCard = dynamic(loadDeferredChunkFromManifest("run-detail-post-commit-habit-loop"), {
  loading: () => null,
});

const RunDetailArchitectureGraphSection = dynamic(
  loadDeferredChunkFromManifest("run-detail-architecture-graph-section"),
  {
    loading: () => (
      <section id="architecture-graph" className="scroll-mt-24">
        <div
          className="h-64 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
          role="status"
          aria-label="Loading architecture graph"
        />
      </section>
    ),
  },
);

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
    <RunDetailArchitectureGraphSection
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
    <PostCommitHabitLoopCard
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
