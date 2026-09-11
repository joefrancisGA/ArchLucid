"use client";

import { useQueries } from "@tanstack/react-query";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useEffectiveWorkingCareerRehearsalDoor } from "@/hooks/use-effective-working-career-rehearsal-door";
import { useRunSummaryQuery } from "@/hooks/use-run-summary-query";
import { getRunSummary } from "@/lib/api";
import { resolveHonestyWorkingCareerRehearsalDoor } from "@/lib/governance/working-career-rehearsal-door-stamp";
import {
  capValueReportContributingRunIds,
  periodContributingRunsRequireHonesty,
  resolveValueReportCareerHonesty,
  resolveValueReportScopedCareerHonesty,
  type ValueReportCareerHonestyPresentation,
  type ValueReportContributingRunStamp,
} from "@/lib/insights/value-report-career-honesty";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export type UseValueReportCareerHonestyInput = {
  readonly isSample?: boolean;
  readonly scopedRunId?: string;
  readonly contributingRunIds?: readonly string[];
};

export function useValueReportCareerHonesty(
  input: UseValueReportCareerHonestyInput,
): ValueReportCareerHonestyPresentation | null {
  const { isWorkingMode } = useWorkspaceMode();
  const { effectiveDoor } = useEffectiveWorkingCareerRehearsalDoor();
  const trimmedScopedRunId = (input.scopedRunId ?? "").trim();
  const cappedContributingRunIds = capValueReportContributingRunIds(input.contributingRunIds ?? []);
  const periodLookupEnabled =
    isWorkingMode
    && input.isSample !== true
    && trimmedScopedRunId.length === 0
    && cappedContributingRunIds.length > 0;

  const scopedRunSummaryQuery = useRunSummaryQuery(trimmedScopedRunId, {
    enabled: isWorkingMode && trimmedScopedRunId.length > 0 && input.isSample !== true,
  });

  const periodRunSummaryQueries = useQueries({
    queries: cappedContributingRunIds.map((runId) => ({
      queryKey: operatorQueryKeys.runSummary(runId),
      queryFn: () => getRunSummary(runId),
      enabled: periodLookupEnabled,
      staleTime: 30_000,
    })),
  });

  if (!isWorkingMode || input.isSample === true) {
    return null;
  }

  if (trimmedScopedRunId.length > 0 && scopedRunSummaryQuery.data === undefined) {
    return null;
  }

  const scopedHonesty =
    trimmedScopedRunId.length > 0
      ? resolveValueReportScopedCareerHonesty({
          workingDesk: true,
          isSample: input.isSample,
          structuralExecutionMode: scopedRunSummaryQuery.data?.structuralExecutionMode,
          effectiveWorkingCareerRehearsalDoor: resolveHonestyWorkingCareerRehearsalDoor({
            stampedDoor: scopedRunSummaryQuery.data?.workingCareerRehearsalDoor ?? null,
            liveDoor: effectiveDoor,
          }),
        })
      : null;

  const periodStamps: ValueReportContributingRunStamp[] = periodRunSummaryQueries
    .map((query) => query.data)
    .filter((summary) => summary !== undefined)
    .map((summary) => ({
      isSample: summary.isSample,
      structuralExecutionMode: summary.structuralExecutionMode,
      workingCareerRehearsalDoor: summary.workingCareerRehearsalDoor,
    }));

  const periodRequiresHonesty =
    periodLookupEnabled
    && periodStamps.length > 0
    && periodContributingRunsRequireHonesty(periodStamps);

  return resolveValueReportCareerHonesty({
    isSample: input.isSample,
    scopedHonesty,
    periodRequiresHonesty,
  });
}
