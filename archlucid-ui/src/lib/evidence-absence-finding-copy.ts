/**
 * Findings that record the **absence** of something (for example, no architecture components discovered).
 *
 * These are legitimate findings, but presenting them with ready/verified styling reads as "proof was
 * collected" when the underlying signal is "nothing was found". See `docs/library/UI_DESIGN_SYSTEM.md`
 * § Aesthetic rules — status tags must be semantic, and primary content must not overstate posture.
 *
 * Wire titles may still say "topology resources"; buyer labels use architecture-structure language.
 */
const ABSENCE_FINDING_TITLE_PATTERNS: readonly RegExp[] = [/no topology resources were found/i];

/** True when a finding title reports that evidence found nothing, rather than reporting a defect. */
export function isEvidenceAbsenceFindingTitle(title: string | null | undefined): boolean {
  const trimmed = title?.trim() ?? "";

  if (trimmed.length === 0) {
    return false;
  }

  return ABSENCE_FINDING_TITLE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Restates an absence finding as what the evidence did, not as a bare negation.
 * Non-absence titles are returned unchanged so callers can apply this unconditionally.
 */
export function evidenceAbsenceFindingLabel(title: string): string {
  if (/no topology resources were found/i.test(title)) {
    return "Evidence did not surface architecture components";
  }

  return title;
}
