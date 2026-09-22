"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";

import { RunDetailInfeasibleDecisionLead } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailInfeasibleDecisionLead";
import { GovernanceFindingsQueueQuietEnginesHint } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueQuietEnginesHint";
import { ArchitectureIdentityDeskReviewFinalizeAction } from "@/components/architecture/ArchitectureIdentityDeskReviewFinalizeAction";
import { WorkingInstrumentDocumentTitle } from "@/components/architecture/WorkingInstrumentDocumentTitle";
import { TransparencyTrailPanel } from "@/components/feasibility/TransparencyTrailPanel";
import { InhabitedFindingsAssumptionDeltaEntry } from "@/components/governance/InhabitedFindingsAssumptionDeltaEntry";
import { InhabitedFindingsExplorationStrip } from "@/components/governance/InhabitedFindingsExplorationStrip";
import { InhabitedFindingsRoomCard } from "@/components/governance/InhabitedFindingsRoomCard";
import { InhabitedFindingsWorkLeaseHonesty } from "@/components/governance/InhabitedFindingsWorkLeaseHonesty";
import { RunDetailInsightDensityMeasurementDenominatorStrip } from "@/components/reviews/RunDetailInsightDensityMeasurementDenominatorStrip";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import { fetchRunDetailCriticalPageBundle } from "@/lib/fetch-run-detail-page-bundle-client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INHABIT_FINDINGS_DENSITY_IS_GENERATION_SENTENCE } from "@/lib/inhabit/inhabit-findings-density-generation-copy";
import {
  resolveInhabitedFindingsArchitectureId,
  resolveInhabitedFindingsDocumentPresentation,
  type InhabitedFindingsDocumentInput,
} from "@/lib/inhabit/inhabit-findings-document-presentation";
import {
  resolveInhabitedFindingsTrailBundleSnapshot,
  type InhabitedFindingsTrailBundleSnapshot,
} from "@/lib/inhabit/inhabited-findings-trail-bundle";
import { cn } from "@/lib/utils";

export type InhabitedFindingsDocumentChromeProps = InhabitedFindingsDocumentInput & {
  readonly initialTrailBundle?: InhabitedFindingsTrailBundleSnapshot | null;
};

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

  const identityQuery = useArchitectureIdentityQuery(
    resolvedArchitectureId ?? "",
    presentation !== null && resolvedArchitectureId !== null,
  );

  const serverTrailSnapshot =
    props.initialTrailBundle !== undefined && props.initialTrailBundle?.runId === scopedRunId
      ? props.initialTrailBundle
      : null;

  const trailQuery = useQuery({
    queryKey: ["inhabited-findings-transparency-trail", scopedRunId],
    enabled: presentation !== null && scopedRunId.length > 0,
    staleTime: 60_000,
    initialData:
      serverTrailSnapshot !== null
        ? {
            trail: serverTrailSnapshot.trail,
            feasibilityVerdict: serverTrailSnapshot.feasibilityVerdict,
            enginesSucceeded: serverTrailSnapshot.enginesSucceeded,
            runCompleted: serverTrailSnapshot.runCompleted,
          }
        : undefined,
    queryFn: async () => {
      const bundle = await fetchRunDetailCriticalPageBundle(scopedRunId);
      const snapshot = resolveInhabitedFindingsTrailBundleSnapshot(scopedRunId, bundle.data);

      return {
        trail: snapshot.trail,
        feasibilityVerdict: snapshot.feasibilityVerdict,
        enginesSucceeded: snapshot.enginesSucceeded,
        runCompleted: snapshot.runCompleted,
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

      {identityQuery.data !== undefined ? (
        <InhabitedFindingsWorkLeaseHonesty
          drafts={identityQuery.data.drafts}
          currentDraftId={identityQuery.data.currentDraftId}
          latestReviewId={identityQuery.data.latestReviewId}
        />
      ) : null}

      {architectureDisplayName.length > 0 && identityQuery.data !== undefined ? (
        <InhabitedFindingsRoomCard
          architectureDisplayName={architectureDisplayName}
          architectureRequestId={identityQuery.data.currentDraftId}
          scopedRunId={scopedRunId}
          scopedRunTitle={props.scopedRunTitle}
        />
      ) : null}

      {resolvedArchitectureId !== null ? (
        <InhabitedFindingsExplorationStrip
          architectureId={resolvedArchitectureId}
          scopedRunId={scopedRunId}
        />
      ) : null}

      {resolvedArchitectureId !== null ? (
        <InhabitedFindingsAssumptionDeltaEntry
          architectureId={resolvedArchitectureId}
          scopedRunId={scopedRunId}
        />
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

      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="inhabited-findings-density-generation-honesty"
      >
        {INHABIT_FINDINGS_DENSITY_IS_GENERATION_SENTENCE}
      </p>

      {trailQuery.data !== undefined && trailQuery.data.feasibilityVerdict !== null ? (
        <div data-testid="inhabited-findings-infeasible-package">
          <RunDetailInfeasibleDecisionLead
            feasibilityVerdict={trailQuery.data.feasibilityVerdict}
            runId={scopedRunId}
          />
        </div>
      ) : null}

      {trailQuery.data !== undefined ? (
        <RunDetailInsightDensityMeasurementDenominatorStrip
          enginesSucceeded={trailQuery.data.enginesSucceeded}
          analysisStagesComplete={trailQuery.data.runCompleted}
          className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
        />
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
