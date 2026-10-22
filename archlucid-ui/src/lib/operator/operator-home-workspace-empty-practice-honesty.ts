import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";

export const OPERATOR_HOME_WORKSPACE_EMPTY_PRACTICE_HONESTY_TEST_ID =
  "operator-home-workspace-empty-practice-honesty" as const;

export const OPERATOR_HOME_WORKSPACE_EMPTY_PRACTICE_HONESTY_SENTENCE =
  "Practice is selected — empty-state copy here is rehearsal only. Finalize in Record to produce a finalized review record and sealed-record proof." as const;

export function shouldShowOperatorHomeWorkspaceEmptyPracticeHonesty(input: {
  readonly workingMode: boolean;
  readonly selectedDoor: WorkingCareerRehearsalDoorId;
}): boolean {
  return input.workingMode && input.selectedDoor === "rehearsal";
}
