"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useEffectiveWorkingCareerRehearsalDoor } from "@/hooks/use-effective-working-career-rehearsal-door";
import { useRunSummaryQuery } from "@/hooks/use-run-summary-query";
import {
  resolveAlertInboxCareerHonesty,
  type AlertInboxCareerHonestyPresentation,
} from "@/lib/alerts/alert-inbox-career-honesty";
import { resolveHonestyWorkingCareerRehearsalDoor } from "@/lib/governance/working-career-rehearsal-door-stamp";

export type UseAlertInboxCareerHonestyInput = {
  readonly runId?: string | null;
  readonly isSample?: boolean;
};

export function useAlertInboxCareerHonesty(
  input: UseAlertInboxCareerHonestyInput,
): AlertInboxCareerHonestyPresentation | null {
  const { isWorkingMode } = useWorkspaceMode();
  const { effectiveDoor } = useEffectiveWorkingCareerRehearsalDoor();
  const trimmedRunId = (input.runId ?? "").trim();
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
  const isSampleRun = trimmedRunId.length > 0 ? runSummaryQuery.data?.isSample : false;

  return resolveAlertInboxCareerHonesty({
    workingDesk: true,
    isSample: input.isSample === true || isSampleRun === true,
    structuralExecutionMode,
    effectiveWorkingCareerRehearsalDoor: resolveHonestyWorkingCareerRehearsalDoor({
      stampedDoor,
      liveDoor: effectiveDoor,
    }),
  });
}
