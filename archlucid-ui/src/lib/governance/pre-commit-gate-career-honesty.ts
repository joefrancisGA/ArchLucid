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

/** LP-18 / DR-04 — suppress Ready-to-finalize when Working host leaves pre-finalize gate off. */
export function shouldSuppressReadyToFinalizeForPreCommitGateHonesty(input: {
  readonly workingDesk?: boolean;
  readonly preCommitGateEnabled?: boolean | null;
}): boolean {
  return input.workingDesk === true && input.preCommitGateEnabled === false;
}
