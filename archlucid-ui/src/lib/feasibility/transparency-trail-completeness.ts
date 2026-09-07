import type { TransparencyTrail } from "@/types/feasibility-verdict";

export const TRANSPARENCY_TRAIL_INCOMPLETE_FINALIZE_REASON =
  "Finalize requires a transparency trail with asserted, inferred, and skipped sections.";

/** ADR 0073 — null trail is a defect; empty arrays inside a trail object are legal. */
export function isTransparencyTrailComplete(
  trail: TransparencyTrail | null | undefined,
): boolean {
  if (trail === null || trail === undefined) {
    return false;
  }

  if (!Array.isArray(trail.asserted) || !Array.isArray(trail.inferred) || !Array.isArray(trail.skipped)) {
    return false;
  }

  return true;
}

export function transparencyTrailIncompleteFinalizeReason(
  trail: TransparencyTrail | null | undefined,
): string | null {
  if (isTransparencyTrailComplete(trail)) {
    return null;
  }

  if (trail === null || trail === undefined) {
    return TRANSPARENCY_TRAIL_INCOMPLETE_FINALIZE_REASON;
  }

  const missing: string[] = [];

  if (!Array.isArray(trail.asserted)) {
    missing.push("asserted");
  }

  if (!Array.isArray(trail.inferred)) {
    missing.push("inferred");
  }

  if (!Array.isArray(trail.skipped)) {
    missing.push("skipped");
  }

  if (missing.length === 0) {
    return TRANSPARENCY_TRAIL_INCOMPLETE_FINALIZE_REASON;
  }

  return `Transparency trail is missing required sections: ${missing.join(", ")}.`;
}

export const ASSERTED_TRAIL_EMPTY_CAREER_CLAIM_REASON =
  "No asserted intake recorded — do not present this package as evidence-backed.";

/** True when the trail object exists but the asserted section has no entries (FC-13). */
export function isAssertedTransparencyTrailEmpty(
  trail: TransparencyTrail | null | undefined,
): boolean {
  if (!isTransparencyTrailComplete(trail)) {
    return false;
  }

  return trail.asserted.length === 0;
}
