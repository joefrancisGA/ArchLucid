import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { RunTraceViewerLink } from "@/components/RunTraceViewerLink";
import { StatusTag } from "@/components/ui/status-tag";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { formatStageDurationMs } from "@/lib/format-stage-duration";
import { buyerPipelineStageName } from "@/lib/pipeline-stage-buyer-labels";
import {
  mapPipelineStageOutcomeToStatusKind,
  pipelineStageOutcomeLabel,
} from "@/lib/map-pipeline-stage-outcome-status";
import type { StageTimelineSummary } from "@/types/stage-timeline";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

type RunDetailPipelineStagesSectionProps = {
  readonly stageTimeline: StageTimelineSummary[];
  readonly otelTraceId?: string | null;
};

export function RunDetailPipelineStagesSection({
  stageTimeline,
  otelTraceId,
}: RunDetailPipelineStagesSectionProps): ReactElement | null {
  if (stageTimeline.length === 0) {
    return null;
  }

  const buyerPolished = isBuyerPolishedOperatorShellEnv();

  return (
    <section
      id="pipeline-stages"
      className="mb-6"
      data-testid="run-detail-pipeline-stages"
    >
      <h2 className={runDetailSectionHeadingClass}>Pipeline stages</h2>
      <CollapsibleSection
        title="Stage timing and outcomes"
        defaultOpen={false}
        sectionTestId="run-detail-pipeline-stages-collapsible"
      >
        <p className={cn("mb-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Authority pipeline stages for this review (context ingestion through artifacts). Durations are measured in-product; use the trace link for full distributed spans.
        </p>
        {otelTraceId ? (
          <p className={cn("mb-3", OPERATOR_TYPOGRAPHY.body)}>
            <RunTraceViewerLink traceId={otelTraceId} />
          </p>
        ) : null}
        <ul className="space-y-2" data-testid="run-detail-pipeline-stages-list">
          {stageTimeline.map((stage) => (
            <li
              key={stage.stageName}
              className={cn("flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)}
              data-testid={`pipeline-stage-row-${stage.stageName}`}
            >
              <span className="font-medium text-al-text-primary">
                {buyerPipelineStageName(stage.stageName, buyerPolished)}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-al-text-secondary" data-testid="pipeline-stage-duration">
                  {formatStageDurationMs(stage.durationMs ?? null)}
                </span>
                <StatusTag
                  kind={mapPipelineStageOutcomeToStatusKind(stage.outcomeStatus)}
                  label={pipelineStageOutcomeLabel(stage.outcomeStatus)}
                  data-testid="pipeline-stage-status-tag"
                />
              </span>
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </section>
  );
}
