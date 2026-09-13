"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";

import { GovernanceFindingsQueueQuietEnginesHint } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueQuietEnginesHint";
import { ArchitectureIdentityDeskReviewFinalizeAction } from "@/components/architecture/ArchitectureIdentityDeskReviewFinalizeAction";
import { WorkingInstrumentDocumentTitle } from "@/components/architecture/WorkingInstrumentDocumentTitle";
import { TransparencyTrailPanel } from "@/components/feasibility/TransparencyTrailPanel";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { fetchRunDetailCriticalPageBundle } from "@/lib/fetch-run-detail-page-bundle-client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  resolveInhabitedFindingsArchitectureId,
  resolveInhabitedFindingsDocumentPresentation,
  type InhabitedFindingsDocumentInput,
} from "@/lib/inhabit/inhabit-findings-document-presentation";
import { analysisStagesCompleteOnSummary } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/pipeline-complete-on-summary";
import { cn } from "@/lib/utils";

export type InhabitedFindingsDocumentChromeProps = InhabitedFindingsDocumentInput;

/** IH-016–019 / IH-018 / IH-023 — document chrome on Working nested findings. */
export function InhabitedFindingsDocumentChrome(
  props: InhabitedFindingsDocumentChromeProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const presentation = resolveInhabitedFindingsDocumentPresentation({
    ...props,
    workingMode: props.workingMode && isWorkingMode,
  });
  const resolvedArchitectureId = resolveInhabitedFindingsArchitectureId(
    props.pathname,
    props.scopedArchitectureId,
  );
  const scopedRunId = props.scopedRunId?.trim() ?? "";
  const architectureDisplayName = props.architectureDisplayName?.trim() ?? "";

  const trailQuery = useQuery({
    queryKey: ["inhabited-findings-transparency-trail", scopedRunId],
    enabled: presentation !== null && scopedRunId.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const bundle = await fetchRunDetailCriticalPageBundle(scopedRunId);

      return {
        trail: bundle.data.feasibilityVerdict?.transparencyTrail ?? null,
        runCompleted: analysisStagesCompleteOnSummary(bundle.data.progressSummary),
      };
    },
  });

  if (presentation === null) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid="inhabited-findings-document-chrome">
      {architectureDisplayName.length > 0 && resolvedArchitectureId !== null ? (
        <WorkingInstrumentDocumentTitle
          architectureDisplayName={architectureDisplayName}
          parentArchitectureId={resolvedArchitectureId}
          documentTitleSuffix=" · Findings"
        />
      ) : null}

      {presentation.jobSubtitle !== null ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="inhabited-findings-job-subtitle"
        >
          {presentation.jobSubtitle}
        </p>
      ) : null}

      {trailQuery.data !== undefined ? (
        <div data-testid="inhabited-findings-transparency-trail">
          <TransparencyTrailPanel
            trail={trailQuery.data.trail}
            missingTrailDefect={trailQuery.data.runCompleted && trailQuery.data.trail === null}
            defaultExpanded={true}
          />
        </div>
      ) : null}

      {scopedRunId.length > 0 ? (
        <div data-testid="inhabited-findings-quiet-engines">
          <GovernanceFindingsQueueQuietEnginesHint scopedRunId={scopedRunId} />
        </div>
      ) : null}

      {scopedRunId.length > 0 && resolvedArchitectureId !== null ? (
        <div data-testid="inhabited-findings-finalize-verb">
          <ArchitectureIdentityDeskReviewFinalizeAction
            runId={scopedRunId}
            architectureId={resolvedArchitectureId}
            skipWhenInFlight={false}
          />
        </div>
      ) : null}
    </div>
  );
}
