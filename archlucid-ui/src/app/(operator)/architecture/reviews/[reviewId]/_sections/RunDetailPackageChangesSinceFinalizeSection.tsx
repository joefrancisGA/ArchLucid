import { PackageChangesSinceFinalizePanel } from "@/components/PackageChangesSinceFinalizePanel";

import { loadRunDetailPipelineTimelineCached } from "./load-run-detail-pipeline-timeline-cached";
import type { RunDetailDeferredSectionContext } from "./run-detail-page-model";

export type RunDetailPackageChangesSinceFinalizeSectionProps = {
  readonly context: RunDetailDeferredSectionContext;
  readonly finalizeUtc: string | null;
};

/**
 * TB-2200 — review-package tab reuses the same cached pipeline timeline as the activity below-fold
 * boundary (no duplicate timelines-bundle hop).
 */
export async function RunDetailPackageChangesSinceFinalizeSection(
  props: RunDetailPackageChangesSinceFinalizeSectionProps,
): Promise<React.JSX.Element> {
  const pipeline = await loadRunDetailPipelineTimelineCached(
    props.context.routeRunId,
    props.context.usedStaticDemoRun,
    props.context.buyerPolishedArtifactTable,
  );

  return (
    <PackageChangesSinceFinalizePanel
      events={pipeline.pipelineTimelineAllForPackageChanges}
      finalizeUtc={props.finalizeUtc}
    />
  );
}
