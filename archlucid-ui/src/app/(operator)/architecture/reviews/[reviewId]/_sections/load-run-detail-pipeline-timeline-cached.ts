import { cache } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { fetchRunDetailTimelinesBundle } from "@/lib/fetch-run-detail-page-bundle-client";
import { tryStaticDemoPipelineTimeline } from "@/lib/operator/operator-static-demo";
import { isTimelineMilestoneEvent } from "@/lib/timeline-milestone-events";
import type { PipelineTimelineItem } from "@/types/authority";
import type { StageTimelineSummary } from "@/types/stage-timeline";

export type RunDetailPipelineTimelineModel = Readonly<{
  pipelineTimelineForUi: PipelineTimelineItem[] | null;
  pipelineTimelineAllForPackageChanges: PipelineTimelineItem[] | null;
  pipelineTimelineFailure: ApiLoadFailureState | null;
  stageTimelineForUi: StageTimelineSummary[];
}>;

/** Per-request memo for pipeline + stage timelines shared by activity and review-package surfaces. */
export const loadRunDetailPipelineTimelineCached = cache(
  async (
    runId: string,
    usedStaticDemoRun: boolean,
    buyerPolishedArtifactTable: boolean,
  ): Promise<RunDetailPipelineTimelineModel> => {
    let pipelineTimeline: PipelineTimelineItem[] | null = null;
    let pipelineTimelineFailure: ApiLoadFailureState | null = null;
    let stageTimelineForUi: StageTimelineSummary[] = [];

    try {
      const bundle = await fetchRunDetailTimelinesBundle(runId);

      pipelineTimeline = bundle.pipelineTimeline;
      stageTimelineForUi = Array.isArray(bundle.stageTimeline) ? bundle.stageTimeline : [];
    } catch (error) {
      pipelineTimelineFailure = toApiLoadFailure(error);

      if (usedStaticDemoRun) {
        const staticTimeline = tryStaticDemoPipelineTimeline(runId);

        if (staticTimeline !== null && staticTimeline.length > 0) {
          pipelineTimeline = staticTimeline;
          pipelineTimelineFailure = null;
        }
      }
    }

    if (pipelineTimeline === null || pipelineTimeline.length === 0) {
      const staticTimeline = tryStaticDemoPipelineTimeline(runId);

      if (staticTimeline !== null && staticTimeline.length > 0) {
        pipelineTimeline = staticTimeline;
        pipelineTimelineFailure = null;
      }
    }

    const pipelineTimelineForUi: PipelineTimelineItem[] | null = buyerPolishedArtifactTable
      ? pipelineTimeline?.filter((event) => isTimelineMilestoneEvent(event.eventType)) ?? null
      : pipelineTimeline;

    return {
      pipelineTimelineForUi,
      pipelineTimelineAllForPackageChanges: pipelineTimeline,
      pipelineTimelineFailure,
      stageTimelineForUi,
    };
  },
);
