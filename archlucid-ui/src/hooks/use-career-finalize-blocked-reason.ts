"use client";

import { useEffectiveWorkingCareerRehearsalDoor } from "@/hooks/use-effective-working-career-rehearsal-door";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { resolveHonestyWorkingCareerRehearsalDoor } from "@/lib/governance/working-career-rehearsal-door-stamp";
import {
  resolveCareerFinalizeBlockedReason,
  shouldBlockFinalizeForCareerHonesty,
} from "@/lib/runs/run-pipeline-finalize-blocked-honesty";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

export function useCareerFinalizeBlockedReason(input: {
  readonly manifestFinalized: boolean;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly workingCareerRehearsalDoor?: string | null;
  readonly transparencyTrail?: TransparencyTrail | null;
  readonly preCommitGateEnabled?: boolean | null;
}): string | null {
  const { isWorkingMode } = useWorkspaceMode();
  const { effectiveDoor } = useEffectiveWorkingCareerRehearsalDoor();

  if (!isWorkingMode || input.manifestFinalized) {
    return null;
  }

  const honestyInput = {
    workingDesk: isWorkingMode,
    structuralExecutionMode: input.structuralExecutionMode,
    transparencyTrail: input.transparencyTrail,
    preCommitGateEnabled: input.preCommitGateEnabled,
    effectiveWorkingCareerRehearsalDoor: resolveHonestyWorkingCareerRehearsalDoor({
      stampedDoor: input.workingCareerRehearsalDoor,
      liveDoor: effectiveDoor,
    }),
  };

  if (!shouldBlockFinalizeForCareerHonesty(honestyInput)) {
    return null;
  }

  return resolveCareerFinalizeBlockedReason(honestyInput);
}
