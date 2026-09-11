import { resolveHonestyWorkingCareerRehearsalDoor } from "@/lib/governance/working-career-rehearsal-door-stamp";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { RunSummary } from "@/types/authority";

/** CG-022 — shared door stamp + structural Mode for sponsor/export honesty surfaces. */
export function resolveCareerArtifactExportHonestyDoorFields(input: {
  readonly progressSummary?: RunSummary | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly workingCareerRehearsalDoor?: string | null;
  readonly liveDoor?: WorkingCareerRehearsalDoorId | null;
}): {
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly effectiveWorkingCareerRehearsalDoor: WorkingCareerRehearsalDoorId;
} {
  const structuralExecutionMode =
    input.structuralExecutionMode ?? input.progressSummary?.structuralExecutionMode ?? undefined;
  const effectiveWorkingCareerRehearsalDoor = resolveHonestyWorkingCareerRehearsalDoor({
    stampedDoor: input.workingCareerRehearsalDoor ?? input.progressSummary?.workingCareerRehearsalDoor,
    liveDoor: input.liveDoor,
  });

  return {
    structuralExecutionMode,
    effectiveWorkingCareerRehearsalDoor,
  };
}
