import {
  StructuralExecutionModeWire,
  type StructuralExecutionModeInput,
} from "@/lib/structural-execution-mode";
import {
  SIMULATOR_MODE_AI_OPERATION_NOTICE_BODY,
  SIMULATOR_MODE_AI_OPERATION_NOTICE_TITLE,
} from "@/lib/simulator-mode-chrome-copy";

import type { CareerArtifactKind } from "@/lib/career-artifact/career-artifact-honesty";

export const SIMULATOR_REHEARSAL_CAREER_BLOCK_REASON =
  "Simulator rehearsal cannot be career-complete without explicit rehearsal labeling on the artifact.";

export const SIMULATOR_REHEARSAL_GUIDED_WARNING =
  "Simulator rehearsal — not production customer evidence.";

export const SIMULATOR_REHEARSAL_HEADER_TITLE = SIMULATOR_MODE_AI_OPERATION_NOTICE_TITLE;

export const SIMULATOR_REHEARSAL_HEADER_BODY = SIMULATOR_MODE_AI_OPERATION_NOTICE_BODY;

export function isRehearsalStructuralExecutionMode(
  mode: StructuralExecutionModeInput,
): boolean {
  if (mode === StructuralExecutionModeWire.Simulator || mode === 0) {
    return true;
  }

  if (mode === StructuralExecutionModeWire.Fallback || mode === 2) {
    return true;
  }

  return false;
}

export function shouldBlockWorkingCareerForSimulatorRehearsal(input: {
  readonly workingDesk?: boolean;
  readonly isSample?: boolean | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly simulatorRehearsalBannerOnArtifact?: boolean;
}): boolean {
  if (input.workingDesk !== true) {
    return false;
  }

  if (input.isSample === true) {
    return false;
  }

  if (!isRehearsalStructuralExecutionMode(input.structuralExecutionMode ?? null)) {
    return false;
  }

  return input.simulatorRehearsalBannerOnArtifact !== true;
}

export function formatSimulatorRehearsalCareerBlockedReason(input: {
  readonly workingDesk?: boolean;
  readonly isSample?: boolean | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly simulatorRehearsalBannerOnArtifact?: boolean;
  readonly artifactKind?: CareerArtifactKind;
}): string | null {
  if (!shouldBlockWorkingCareerForSimulatorRehearsal(input)) {
    return null;
  }

  return SIMULATOR_REHEARSAL_CAREER_BLOCK_REASON;
}

export function shouldSuppressReadyToFinalizeForSimulatorRehearsal(input: {
  readonly workingDesk?: boolean;
  readonly isSample?: boolean | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly simulatorRehearsalBannerOnArtifact?: boolean;
}): boolean {
  return shouldBlockWorkingCareerForSimulatorRehearsal(input);
}
