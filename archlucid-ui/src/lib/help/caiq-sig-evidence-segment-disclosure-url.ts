export const CAIQ_SIG_EVIDENCE_SEGMENT_KEY_PARAM = "caiqSigEvidenceSegmentKey";

export function parseCaiqSigEvidenceSegmentKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function caiqSigEvidenceSegmentDisclosureHrefFromSearch(
  currentSearch: string,
  segmentKey: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (segmentKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(CAIQ_SIG_EVIDENCE_SEGMENT_KEY_PARAM);
  } else {
    params.set(CAIQ_SIG_EVIDENCE_SEGMENT_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
