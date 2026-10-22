"use client";

import { cn } from "@/lib/utils";
import type { ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { RunTraceViewerLink } from "@/components/runs/RunTraceViewerLink";
import { StatusTag } from "@/components/ui/status-tag";
import { isBuyerVocabularyPassActive } from "@/lib/demo-ui-env";
import { formatStageDurationMs, PIPELINE_STAGE_RECORDED_DURATION_SCOPE_LINE } from "@/lib/format-stage-duration";
import { buyerPipelineStageName } from "@/lib/pipeline-stage-buyer-labels";
import {
  mapPipelineStageOutcomeToStatusKind,
  pipelineStageOutcomeLabel} from "@/lib/map-pipeline-stage-outcome-status";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import {
  RUN_PIPELINE_STAGES_OPEN_PARAM,
  parseRunPipelineStagesOpenFromSearch,
  runPipelineStagesDisclosureHrefFromSearch,
} from "@/lib/runs/run-pipeline-stages-disclosure-url";
import {
  RUN_PIPELINE_STAGES_TECHNICAL_OPEN_PARAM,
  parseRunPipelineStagesTechnicalOpenFromSearch,
  runPipelineStagesTechnicalDisclosureHrefFromSearch,
} from "@/lib/runs/run-pipeline-stages-technical-disclosure-url";
import type { StageTimelineSummary } from "@/types/stage-timeline";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type RunDetailPipelineStagesSectionProps = {
  readonly stageTimeline: StageTimelineSummary[];
  readonly otelTraceId?: string | null;
};

export function RunDetailPipelineStagesSection({
  stageTimeline,
  otelTraceId}: RunDetailPipelineStagesSectionProps): ReactElement | null {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const urlPipelineStagesOpen = parseRunPipelineStagesOpenFromSearch(
    searchParams.get(RUN_PIPELINE_STAGES_OPEN_PARAM),
  );
  const urlPipelineStagesTechnicalOpen = parseRunPipelineStagesTechnicalOpenFromSearch(
    searchParams.get(RUN_PIPELINE_STAGES_TECHNICAL_OPEN_PARAM),
  );
  const [open, setOpenState] = useState(urlPipelineStagesOpen);
  const openRef = useRef(open);
  openRef.current = open;
  const [technicalOpen, setTechnicalOpenState] = useState(urlPipelineStagesTechnicalOpen);
  const technicalOpenRef = useRef(technicalOpen);
  technicalOpenRef.current = technicalOpen;

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        runPipelineStagesDisclosureHrefFromSearch(window.location.search.slice(1), detailsOpen, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      if (openRef.current === detailsOpen) {
        return;
      }

      openRef.current = detailsOpen;
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  const syncTechnicalOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        runPipelineStagesTechnicalDisclosureHrefFromSearch(window.location.search.slice(1), detailsOpen, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setTechnicalOpen = useCallback(
    (detailsOpen: boolean) => {
      if (technicalOpenRef.current === detailsOpen) {
        return;
      }

      technicalOpenRef.current = detailsOpen;
      setTechnicalOpenState(detailsOpen);
      syncTechnicalOpenToUrl(detailsOpen);
    },
    [syncTechnicalOpenToUrl],
  );

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      const nextOpen = parseRunPipelineStagesOpenFromSearch(
        new URLSearchParams(window.location.search).get(RUN_PIPELINE_STAGES_OPEN_PARAM),
      );
      const nextTechnicalOpen = parseRunPipelineStagesTechnicalOpenFromSearch(
        new URLSearchParams(window.location.search).get(RUN_PIPELINE_STAGES_TECHNICAL_OPEN_PARAM),
      );

      if (openRef.current !== nextOpen) {
        openRef.current = nextOpen;
        setOpenState(nextOpen);
      }

      if (technicalOpenRef.current !== nextTechnicalOpen) {
        technicalOpenRef.current = nextTechnicalOpen;
        setTechnicalOpenState(nextTechnicalOpen);
      }
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);

  useEffect(() => {
    if (openRef.current !== urlPipelineStagesOpen) {
      openRef.current = urlPipelineStagesOpen;
      setOpenState(urlPipelineStagesOpen);
    }

    if (technicalOpenRef.current !== urlPipelineStagesTechnicalOpen) {
      technicalOpenRef.current = urlPipelineStagesTechnicalOpen;
      setTechnicalOpenState(urlPipelineStagesTechnicalOpen);
    }
  }, [urlPipelineStagesOpen, urlPipelineStagesTechnicalOpen]);

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
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {PIPELINE_STAGE_RECORDED_DURATION_SCOPE_LINE}
            </p>
            <ul className="space-y-2" data-testid="run-detail-pipeline-stages-technical-list">
              {stageTimeline.map((stage) => (
                <li
                  key={stage.stageName}
                  className={cn("flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)}
                >
                  <span className="font-medium text-al-text-primary">
                    {buyerPipelineStageName(stage.stageName, buyerPipelineLabels)}
                  </span>
                  <span className="text-al-text-secondary">
                    <span className="sr-only">Recorded stage time</span>
                    <span data-testid="pipeline-stage-duration">
                      {formatStageDurationMs(stage.durationMs ?? null)}
                    </span>
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
