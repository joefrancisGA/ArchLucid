import {
  StructuralExecutionModeWire,
  type StructuralExecutionModeInput,
} from "@/lib/structural-execution-mode";

import {
  isWorkingCareerIntent,
  type WorkingCareerRehearsalIntentId,
} from "@/lib/governance/working-career-rehearsal-intent";

export const WORKING_CAREER_BLOCKED_SIMULATOR_HOST_REASON =
  "Record requires Real execution or an explicit Practice review type — Simulator host mode cannot run as Record.";

export function isSimulatorStructuralExecutionMode(
  mode: StructuralExecutionModeInput,
): boolean {
  return mode === StructuralExecutionModeWire.Simulator
    || mode === 0
    || mode === StructuralExecutionModeWire.Fallback
    || mode === 2;
}

export function isRealStructuralExecutionMode(mode: StructuralExecutionModeInput): boolean {
  return mode === StructuralExecutionModeWire.Real || mode === 1;
}

/** AS-078: Career intent cannot silently execute under Simulator host mode. */
export function resolveWorkingCareerRehearsalBlockedReason(input: {
  readonly workingDesk?: boolean;
  readonly intent: WorkingCareerRehearsalIntentId;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly realExecutionAvailable?: boolean;
}): string | null {
  if (input.workingDesk !== true) {
    return null;
  }

  if (!isWorkingCareerIntent(input.intent)) {
    return null;
  }

  if (input.realExecutionAvailable === true && isRealStructuralExecutionMode(input.structuralExecutionMode ?? null)) {
    return null;
  }

  if (input.realExecutionAvailable === true && !isSimulatorStructuralExecutionMode(input.structuralExecutionMode ?? null)) {
    return null;
  }

  return WORKING_CAREER_BLOCKED_SIMULATOR_HOST_REASON;
}

export function shouldLabelWorkingIntentAsRehearsal(input: {
  readonly workingDesk?: boolean;
  readonly intent: WorkingCareerRehearsalIntentId;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
}): boolean {
  if (input.workingDesk !== true) {
    return false;
  }

  if (isWorkingRehearsalIntent(input.intent)) {
    return true;
  }

  return isSimulatorStructuralExecutionMode(input.structuralExecutionMode ?? null);
}

function isWorkingRehearsalIntent(intent: WorkingCareerRehearsalIntentId): boolean {
  return intent === "rehearsal";
}
