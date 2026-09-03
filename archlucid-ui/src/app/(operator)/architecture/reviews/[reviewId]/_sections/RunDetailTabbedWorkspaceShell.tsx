import { Suspense } from "react";

import { resolveReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import {
  ReviewDetailWorkspaceDeferred,
  RunDetailExplanationSkeleton,
  RunDetailTabbedSectionNavDeferred,
} from "./RunDetailTabbedWorkspaceDeferredImports";
import type { RunDetailTabbedWorkspaceResolved } from "./resolve-run-detail-tabbed-workspace";
import type { RunDetailPageModel } from "./run-detail-page-model";

type RunDetailTabbedWorkspaceShellProps = {
  readonly model: RunDetailPageModel;
  readonly resolved: RunDetailTabbedWorkspaceResolved;
};

/** Tab chrome and deferred chunk wiring for the tabbed run-detail workspace. */
export function RunDetailTabbedWorkspaceShell(props: RunDetailTabbedWorkspaceShellProps): React.JSX.Element {
  const { model, resolved } = props;

  return (
    <Suspense fallback={<RunDetailExplanationSkeleton />}>
      <ReviewDetailWorkspaceDeferred
        runId={model.resolvedDetail.run.runId}
        defensibilityStrip={resolved.defensibilityStripEl}
        tabSectionNav={
          <RunDetailTabbedSectionNavDeferred
            runId={model.resolvedDetail.run.runId}
            sections={model.runDetailNavSections}
          />
        }
        inPipelineBanner={resolved.inPipelineBannerEl}
        lifecycle={resolved.lifecycle}
        tabLifecycle={resolveReviewWorkspaceLifecycle({
          manifestId: model.manifestId,
          showProgressTracker: model.showProgressTracker,
          runCompleted: model.resolvedDetail.run.completedUtc != null,
        })}
        tabActivityAt={resolved.tabActivityAt}
        tabCounts={resolved.tabCounts}
        panels={resolved.panels}
      />
    </Suspense>
  );
}
