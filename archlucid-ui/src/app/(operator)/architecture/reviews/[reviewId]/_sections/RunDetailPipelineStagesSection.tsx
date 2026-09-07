"use client";

import { cn } from "@/lib/utils";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
import {
  parseRunPipelineStagesOpenFromSearch,
  runPipelineStagesDisclosureHrefFromSearch,
} from "@/lib/runs/run-pipeline-stages-disclosure-url";
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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const runPipelineStagesOpenParam = searchParams.get("runPipelineStagesOpen");
  const [open, setOpenState] = useState(() => parseRunPipelineStagesOpenFromSearch(runPipelineStagesOpenParam));
  const [technicalOpen, setTechnicalOpen] = useState(false);

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(runPipelineStagesDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseRunPipelineStagesOpenFromSearch(runPipelineStagesOpenParam));
  }, [runPipelineStagesOpenParam]);

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
        open={open}
        onToggle={setOpen}
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
        <CollapsibleSection
          title="Technical details"
          open={technicalOpen}
          onToggle={setTechnicalOpen}
          sectionTestId="run-detail-pipeline-stages-technical-collapsible"
        >
          <div className="space-y-3">
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
        </CollapsibleSection>
      </CollapsibleSection>
    </section>
  );
}
