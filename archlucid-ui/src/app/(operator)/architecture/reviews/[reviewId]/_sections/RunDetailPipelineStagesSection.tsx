import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { RunTraceViewerLink } from "@/components/runs/RunTraceViewerLink";
import { StatusTag } from "@/components/ui/status-tag";
import { isBuyerVocabularyPassActive } from "@/lib/demo-ui-env";
import { formatStageDurationMs } from "@/lib/format-stage-duration";
import { buyerPipelineStageName } from "@/lib/pipeline-stage-buyer-labels";
import {
  mapPipelineStageOutcomeToStatusKind,
  pipelineStageOutcomeLabel,
} from "@/lib/map-pipeline-stage-outcome-status";
import type { StageTimelineSummary } from "@/types/stage-timeline";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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

  const buyerPipelineLabels = isBuyerVocabularyPassActive();

  return (
    <section
      id="pipeline-stages"
      className="mb-6 scroll-mt-24"
      data-testid="run-detail-pipeline-stages"
    >
      <CollapsibleSection
        title="Analysis stages"
        defaultOpen={false}
        sectionTestId="run-detail-pipeline-stages-collapsible"
      >
        <p className={cn("mb-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Stages for this review from evidence intake through the sealed review record. Open technical
          details for per-stage timing and distributed trace spans.
        </p>
        <ul className="mb-3 space-y-2" data-testid="run-detail-pipeline-stages-list">
          {stageTimeline.map((stage) => (
            <li
              key={stage.stageName}
              className={cn("flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)}
              data-testid={`pipeline-stage-row-${stage.stageName}`}
            >
              <span className="font-medium text-al-text-primary">
                {buyerPipelineStageName(stage.stageName, buyerPipelineLabels)}
              </span>
              <StatusTag
                kind={mapPipelineStageOutcomeToStatusKind(stage.outcomeStatus)}
                label={pipelineStageOutcomeLabel(stage.outcomeStatus)}
                data-testid="pipeline-stage-status-tag"
              />
            </li>
          ))}
        </ul>
        <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
          <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            Technical details
          </summary>
          <div className="mt-3 space-y-3">
            {otelTraceId ? (
              <div className={OPERATOR_TYPOGRAPHY.body}>
                <RunTraceViewerLink traceId={otelTraceId} />
              </div>
            ) : null}
            <ul className="space-y-2" data-testid="run-detail-pipeline-stages-technical-list">
              {stageTimeline.map((stage) => (
                <li
                  key={stage.stageName}
                  className={cn("flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)}
                >
                  <span className="font-medium text-al-text-primary">
                    {buyerPipelineStageName(stage.stageName, buyerPipelineLabels)}
                  </span>
                  <span className="text-al-text-secondary" data-testid="pipeline-stage-duration">
                    {formatStageDurationMs(stage.durationMs ?? null)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </CollapsibleSection>
    </section>
  );
}
