import {
  isRehearsalStructuralExecutionMode,
  SIMULATOR_REHEARSAL_HEADER_BODY,
  SIMULATOR_REHEARSAL_HEADER_TITLE,
} from "@/lib/governance/simulator-career-honesty";
import {
  DEFAULT_WORKING_CAREER_REHEARSAL_DOOR,
  type WorkingCareerRehearsalDoorId,
} from "@/lib/governance/working-career-rehearsal-door";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

/** CG-023 — print-visible rehearsal label when execute stamp is not career-complete. */
export const PACKAGE_PRINT_REHEARSAL_STRIP_TITLE = "Rehearsal — not career-complete";

export const PACKAGE_PRINT_REHEARSAL_CAREER_DOOR_BODY =
  "This print summary was produced under Simulator or Fallback execution on the Working Career door. It is not a career-complete sealed record for board, procurement, or sponsor distribution.";

export const PACKAGE_PRINT_REHEARSAL_DOOR_BODY =
  "This print summary was produced under the Working Rehearsal door with Simulator or Fallback execution. Rehearsal output is labeled practice — not production customer evidence.";

export type PackagePrintRehearsalHonestyStrip = {
  readonly title: string;
  readonly body: string;
  readonly modeNoticeTitle: string;
  readonly modeNoticeBody: string;
};

export function shouldShowPackagePrintRehearsalHonestyStrip(input: {
  readonly workingDesk?: boolean;
  readonly isSample?: boolean | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
}): boolean {
  if (input.workingDesk !== true) {
    return false;
  }

  if (input.isSample === true) {
    return false;
  }

  return isRehearsalStructuralExecutionMode(input.structuralExecutionMode ?? null);
}

/** Resolves print-only rehearsal honesty when structural Mode is Simulator/Fallback (CG-023). */
export function resolvePackagePrintRehearsalHonestyStrip(input: {
  readonly workingDesk?: boolean;
  readonly isSample?: boolean | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly effectiveWorkingCareerRehearsalDoor?: WorkingCareerRehearsalDoorId | null;
}): PackagePrintRehearsalHonestyStrip | null {
  if (!shouldShowPackagePrintRehearsalHonestyStrip(input)) {
    return null;
  }

  const effectiveDoor = input.effectiveWorkingCareerRehearsalDoor ?? DEFAULT_WORKING_CAREER_REHEARSAL_DOOR;
  const body =
    effectiveDoor === "rehearsal"
      ? PACKAGE_PRINT_REHEARSAL_DOOR_BODY
      : PACKAGE_PRINT_REHEARSAL_CAREER_DOOR_BODY;

  return {
    title: PACKAGE_PRINT_REHEARSAL_STRIP_TITLE,
    body,
    modeNoticeTitle: SIMULATOR_REHEARSAL_HEADER_TITLE,
    modeNoticeBody: SIMULATOR_REHEARSAL_HEADER_BODY,
  };
}
