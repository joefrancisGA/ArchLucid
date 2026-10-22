"use client";

import { useCallback, useMemo } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReadonlyURLSearchParams } from "next/navigation";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  extractGovernanceFindingIds,
  resolveAssignedToMeOldestFindingTarget,
  resolveContinueLastFindingTarget,
  resolveFirstFindingTriageTarget,
} from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";
import {
  resolveFindingsQueueTriageEmphasizedStepId,
  resolveFindingsQueueTriageSteps,
} from "@/lib/findings-queue-triage-checklist";
import { usePrefetchItsmFindingCorrelations } from "@/lib/use-itsm-finding-correlations";

export type UseGovernanceFindingsQueueTriageTargetsInput = {
  readonly displayedRows: readonly GovernanceFindingQueueRow[];
  readonly rows: readonly GovernanceFindingQueueRow[];
  readonly scopedRunId: string | null;
  readonly scopedRunFilterActive: boolean;
  readonly isAssignedToMe: boolean;
  readonly searchParams: ReadonlyURLSearchParams;
  readonly navHref: string;
  readonly router: AppRouterInstance;
};

export function useGovernanceFindingsQueueTriageTargets({
  displayedRows,
  rows,
  scopedRunId,
  scopedRunFilterActive,
  isAssignedToMe,
  searchParams,
  navHref,
  router,
}: UseGovernanceFindingsQueueTriageTargetsInput) {
  const findingIds = useMemo(() => extractGovernanceFindingIds(displayedRows), [displayedRows]);
  usePrefetchItsmFindingCorrelations(findingIds);

  const onPickReviewForTriage = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);
      router.replace(`${navHref}?${params.toString()}`, { scroll: false });
    },
    [navHref, router, searchParams],
  );

  const firstFindingTriageTarget = useMemo(
    () =>
      resolveFirstFindingTriageTarget(
        displayedRows,
        isAssignedToMe,
        scopedRunFilterActive ? scopedRunId : null,
      ),
    [displayedRows, isAssignedToMe, scopedRunFilterActive, scopedRunId],
  );

  const continueLastFinding = useMemo(
    () =>
      resolveContinueLastFindingTarget(
        displayedRows,
        scopedRunFilterActive ? scopedRunId : null,
      ),
    [displayedRows, scopedRunFilterActive, scopedRunId],
  );

  const dispositionRecorded = useMemo(
    () =>
      displayedRows.some(
        (row) =>
          row.recordKind === "finding" && (row.latestDisposition?.trim() ?? "").length > 0,
      ),
    [displayedRows],
  );

  const findingsQueueTriageSteps = useMemo(
    () =>
      resolveFindingsQueueTriageSteps({
        reviewPicked: scopedRunFilterActive,
        findingOpened: continueLastFinding !== null,
        dispositionRecorded,
      }),
    [continueLastFinding, dispositionRecorded, scopedRunFilterActive],
  );

  const findingsQueueTriageEmphasizedStepId = useMemo(
    () =>
      resolveFindingsQueueTriageEmphasizedStepId({
        reviewPicked: scopedRunFilterActive,
        findingOpened: continueLastFinding !== null,
        dispositionRecorded,
      }),
    [continueLastFinding, dispositionRecorded, scopedRunFilterActive],
  );

  const assignedToMeOldestFindingTarget = useMemo(
    () => resolveAssignedToMeOldestFindingTarget(rows, isAssignedToMe),
    [isAssignedToMe, rows],
  );

  return {
    findingIds,
    onPickReviewForTriage,
    firstFindingTriageTarget,
    continueLastFinding,
    findingsQueueTriageSteps,
    findingsQueueTriageEmphasizedStepId,
    assignedToMeOldestFindingTarget,
  };
}
