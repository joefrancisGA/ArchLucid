import type { CoveragePreviewAssignment } from "@/lib/api/coverage-preview-api";

export type CoveragePackOverride = {
  readonly policyPackId: string;
  readonly excluded: boolean;
  readonly exclusionReason: string;
};

const sessionOverrides: CoveragePackOverride[] = [];

const NON_EXCLUDABLE_SELECTION_STATES = new Set([
  "AlwaysActive",
  "RequiredAndLocked",
]);

/** Operator may exclude optional/platform/contextual packs — not baseline or org-required rows. */
export function isCoveragePreviewAssignmentExcludable(
  assignment: CoveragePreviewAssignment,
): boolean {
  if (!assignment.includedInRunEvaluation) {
    return false;
  }

  return !NON_EXCLUDABLE_SELECTION_STATES.has(assignment.selectionState);
}

export function upsertCoveragePackOverride(
  overrides: readonly CoveragePackOverride[],
  patch: CoveragePackOverride,
): CoveragePackOverride[] {
  const existingIndex = overrides.findIndex((row) => row.policyPackId === patch.policyPackId);

  if (existingIndex < 0) {
    return [...overrides, patch];
  }

  return overrides.map((row, index) => (index === existingIndex ? { ...row, ...patch } : row));
}

export function findCoveragePackOverride(
  overrides: readonly CoveragePackOverride[],
  policyPackId: string,
): CoveragePackOverride | undefined {
  return overrides.find((row) => row.policyPackId === policyPackId);
}

/** Session-scoped overrides collected in the wizard before create-run acknowledgement. */
export function setSessionCoveragePackOverrides(overrides: readonly CoveragePackOverride[]): void {
  sessionOverrides.length = 0;
  sessionOverrides.push(...overrides);
}

export function getSessionCoveragePackOverrides(): readonly CoveragePackOverride[] {
  return sessionOverrides;
}

export function clearSessionCoveragePackOverrides(): void {
  sessionOverrides.length = 0;
}

export function validateCoveragePackOverrides(
  overrides: readonly CoveragePackOverride[],
): string | null {
  for (const override of overrides) {
    if (!override.excluded) {
      continue;
    }

    if (override.exclusionReason.trim().length === 0) {
      return "Add a short reason for each excluded policy pack.";
    }
  }

  return null;
}

export function toCoveragePreviewUserOverrides(
  overrides: readonly CoveragePackOverride[],
): Array<{ policyPackId: string; excluded: boolean; exclusionReason: string }> {
  return overrides
    .filter((override) => override.excluded)
    .map((override) => ({
      policyPackId: override.policyPackId,
      excluded: true,
      exclusionReason: override.exclusionReason.trim(),
    }));
}

export function toRunCoverageAcknowledgementEntries(
  overrides: readonly CoveragePackOverride[],
): Array<{ policyPackId: string; excluded: boolean; exclusionReason: string }> {
  return overrides
    .filter((override) => override.excluded)
    .map((override) => ({
      policyPackId: override.policyPackId,
      excluded: true,
      exclusionReason: override.exclusionReason.trim(),
    }));
}
