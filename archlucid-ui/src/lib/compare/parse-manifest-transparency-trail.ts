import type { FeasibilityVerdictKind, TransparencyTrail } from "@/types/feasibility-verdict";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseTransparencyTrail(value: unknown): TransparencyTrail | null {
  if (!isRecord(value)) {
    return null;
  }

  const asserted = Array.isArray(value.asserted) ? value.asserted : [];
  const inferred = Array.isArray(value.inferred) ? value.inferred : [];
  const skipped = Array.isArray(value.skipped) ? value.skipped : [];

  return {
    asserted: asserted as TransparencyTrail["asserted"],
    inferred: inferred as TransparencyTrail["inferred"],
    skipped: skipped as TransparencyTrail["skipped"],
  };
}

/** Reads ADR 0050 transparency trail from a sealed manifest wire payload. */
export function parseManifestTransparencyTrail(manifest: unknown): TransparencyTrail | null {
  if (!isRecord(manifest)) {
    return null;
  }

  const feasibilityVerdict = manifest.feasibilityVerdict;

  if (!isRecord(feasibilityVerdict)) {
    return null;
  }

  return parseTransparencyTrail(feasibilityVerdict.transparencyTrail);
}

const FEASIBILITY_VERDICT_KINDS: readonly FeasibilityVerdictKind[] = [
  "Feasible",
  "SoftInfeasible",
  "HardInfeasible",
];

/** Reads feasibility verdict kind from a sealed manifest wire payload (FC-34). */
export function parseManifestFeasibilityVerdictKind(manifest: unknown): FeasibilityVerdictKind | null {
  if (!isRecord(manifest)) {
    return null;
  }

  const feasibilityVerdict = manifest.feasibilityVerdict;

  if (!isRecord(feasibilityVerdict)) {
    return null;
  }

  const kind = feasibilityVerdict.kind;

  if (typeof kind !== "string") {
    return null;
  }

  if (FEASIBILITY_VERDICT_KINDS.includes(kind as FeasibilityVerdictKind)) {
    return kind as FeasibilityVerdictKind;
  }

  return null;
}
