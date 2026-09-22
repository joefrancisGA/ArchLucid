"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useEffectiveWorkingCareerRehearsalDoor } from "@/hooks/use-effective-working-career-rehearsal-door";
import { useRunSummaryQuery } from "@/hooks/use-run-summary-query";
import { resolveHonestyWorkingCareerRehearsalDoor } from "@/lib/governance/working-career-rehearsal-door-stamp";
import {
  resolveScorecardKpiCareerHonesty,
  type ScorecardKpiCareerHonestyPresentation,
} from "@/lib/scorecard/scorecard-kpi-career-honesty";

export type UseScorecardKpiCareerHonestyInput = {
  readonly isSample?: boolean;
  readonly scopedRunId?: string;
};

export function useScorecardKpiCareerHonesty(
  input: UseScorecardKpiCareerHonestyInput,
): ScorecardKpiCareerHonestyPresentation | null {
  const { isWorkingMode } = useWorkspaceMode();
  const { effectiveDoor } = useEffectiveWorkingCareerRehearsalDoor();
  const trimmedRunId = (input.scopedRunId ?? "").trim();
  const runSummaryQuery = useRunSummaryQuery(trimmedRunId, {
    enabled: isWorkingMode && trimmedRunId.length > 0 && input.isSample !== true,
  });

  if (!isWorkingMode || input.isSample === true) {
    return null;
  }

  if (trimmedRunId.length > 0 && runSummaryQuery.data === undefined) {
    return null;
  }

  const stampedDoor = runSummaryQuery.data?.workingCareerRehearsalDoor ?? null;
  const structuralExecutionMode =
    trimmedRunId.length > 0 ? runSummaryQuery.data?.structuralExecutionMode : undefined;

  return resolveScorecardKpiCareerHonesty({
    workingDesk: true,
    isSample: input.isSample,
    structuralExecutionMode,
    effectiveWorkingCareerRehearsalDoor: resolveHonestyWorkingCareerRehearsalDoor({
      stampedDoor,
      liveDoor: effectiveDoor,
    }),
  });
}
