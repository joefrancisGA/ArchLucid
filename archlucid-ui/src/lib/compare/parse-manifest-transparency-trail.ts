import type { TransparencyTrail } from "@/types/feasibility-verdict";

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
