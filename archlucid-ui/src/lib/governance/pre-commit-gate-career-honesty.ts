export const PRE_COMMIT_GATE_DISABLED_TITLE =
  "Finalize will not be blocked by policy";

export const PRE_COMMIT_GATE_DISABLED_CAREER_COPY =
  "Serious findings can still be sealed here. This is not a fully governed review record.";

export function formatPreCommitGateDisabledCareerBlockedReason(
  preCommitGateEnabled: boolean | null | undefined,
): string | null {
  if (preCommitGateEnabled !== false) {
    return null;
  }

  return PRE_COMMIT_GATE_DISABLED_CAREER_COPY;
}
