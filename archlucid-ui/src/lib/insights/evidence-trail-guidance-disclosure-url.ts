export const EVIDENCE_TRAIL_GUIDANCE_OPEN_PARAM = "evidenceTrailGuidanceOpen";

export function parseEvidenceTrailGuidanceOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function evidenceTrailGuidanceDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(EVIDENCE_TRAIL_GUIDANCE_OPEN_PARAM);
  } else {
    params.set(EVIDENCE_TRAIL_GUIDANCE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
