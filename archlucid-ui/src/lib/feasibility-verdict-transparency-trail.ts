import type { InferredTrailEntry, TransparencyTrail } from "@/types/feasibility-verdict";

/** Inferred-trail prefix written by {@link AuthorityFeasibilityVerdictComposer} for TB-2229. */
export const FEASIBILITY_BLOCKING_FINDING_TRAIL_KEY_PREFIX = "finding.blocking.";

export type FeasibilityVerdictDriverKind =
  | "blocking-finding"
  | "policy-violation"
  | "manifest-issue"
  | "uncovered-requirement";

export type FeasibilityVerdictDriver = {
  readonly kind: FeasibilityVerdictDriverKind;
  readonly key: string;
  readonly label: string;
  readonly findingId?: string;
  readonly confidence?: number;
};

function pushInferredDriver(
  drivers: FeasibilityVerdictDriver[],
  entry: InferredTrailEntry,
  kind: FeasibilityVerdictDriverKind,
  findingId?: string,
): void {
  const label = entry.value.trim();

  if (label.length === 0) {
    return;
  }

  drivers.push({
    kind,
    key: entry.key,
    label,
    ...(findingId !== undefined ? { findingId } : {}),
    confidence: entry.confidence,
  });
}

/** Surfaces structured verdict drivers from the transparency trail instead of raw inferred keys. */
export function parseFeasibilityVerdictDrivers(
  trail: TransparencyTrail | undefined,
): readonly FeasibilityVerdictDriver[] {
  if (trail === undefined) {
    return [];
  }

  const drivers: FeasibilityVerdictDriver[] = [];

  for (const entry of trail.inferred) {
    const key = entry.key.trim();

    if (key.length === 0) {
      continue;
    }

    if (key.startsWith(FEASIBILITY_BLOCKING_FINDING_TRAIL_KEY_PREFIX)) {
      const findingId = key.slice(FEASIBILITY_BLOCKING_FINDING_TRAIL_KEY_PREFIX.length).trim();

      if (findingId.length === 0) {
        continue;
      }

      pushInferredDriver(drivers, entry, "blocking-finding", findingId);
      continue;
    }

    if (key.startsWith("policy.violation.")) {
      pushInferredDriver(drivers, entry, "policy-violation");
      continue;
    }

    if (key.startsWith("manifest.issue.")) {
      pushInferredDriver(drivers, entry, "manifest-issue");
      continue;
    }

    if (key.startsWith("requirement.uncovered.")) {
      pushInferredDriver(drivers, entry, "uncovered-requirement");
    }
  }

  return drivers;
}

/** Omits inferred entries already summarized in the verdict drivers panel. */
export function filterFeasibilityTransparencyTrailInferred(
  trail: TransparencyTrail,
): readonly InferredTrailEntry[] {
  return trail.inferred.filter((entry) => !isStructuredFeasibilityDriverKey(entry.key));
}

export function isStructuredFeasibilityDriverKey(key: string): boolean {
  const trimmed = key.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return (
    trimmed.startsWith(FEASIBILITY_BLOCKING_FINDING_TRAIL_KEY_PREFIX)
    || trimmed.startsWith("policy.violation.")
    || trimmed.startsWith("manifest.issue.")
    || trimmed.startsWith("requirement.uncovered.")
  );
}
