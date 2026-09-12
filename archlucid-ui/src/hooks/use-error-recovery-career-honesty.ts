"use client";

import { useMemo } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useEffectiveWorkingCareerRehearsalDoor } from "@/hooks/use-effective-working-career-rehearsal-door";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import {
  resolveErrorRecoveryCareerHonesty,
  type ErrorRecoveryCareerHonestyPresentation,
} from "@/lib/error-recovery/error-recovery-career-honesty";
import { readErrorRecoveryRunStampFromCache } from "@/lib/error-recovery/read-error-recovery-run-stamp-from-cache";

export type UseErrorRecoveryCareerHonestyInput = {
  readonly scopedRunId?: string;
};

/** CG-096 — error/recovery honesty from cached execute stamp when available. */
export function useErrorRecoveryCareerHonesty(
  input: UseErrorRecoveryCareerHonestyInput,
): ErrorRecoveryCareerHonestyPresentation | null {
  const { isWorkingMode } = useWorkspaceMode();
  const { effectiveDoor } = useEffectiveWorkingCareerRehearsalDoor();
  const scope = useOperatorScopeQueryKey();
  const trimmedRunId = (input.scopedRunId ?? "").trim();

  return useMemo(() => {
    if (!isWorkingMode) {
      return null;
    }

    const cachedStamp =
      trimmedRunId.length > 0 ? readErrorRecoveryRunStampFromCache(trimmedRunId, scope) : null;

    return resolveErrorRecoveryCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: cachedStamp?.structuralExecutionMode,
      stampedWorkingCareerRehearsalDoor: cachedStamp?.workingCareerRehearsalDoor ?? null,
      liveWorkingCareerRehearsalDoor: effectiveDoor,
    });
  }, [
    effectiveDoor,
    isWorkingMode,
    scope,
    trimmedRunId,
  ]);
}
