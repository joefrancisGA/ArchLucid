export const PRE_COMMIT_GATE_DISABLED_CAREER_COPY =
  "Pre-finalize governance gate is off — this seal is not career-complete";

export function formatPreCommitGateDisabledCareerBlockedReason(
  preCommitGateEnabled: boolean | null | undefined,
): string | null {
  if (preCommitGateEnabled !== false) {
    return null;
  }

  return PRE_COMMIT_GATE_DISABLED_CAREER_COPY;
}
