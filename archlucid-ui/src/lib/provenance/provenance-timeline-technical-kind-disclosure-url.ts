export const PROVENANCE_TIMELINE_TECHNICAL_KIND_REFERENCE_ID_PARAM = "provenanceTimelineTechnicalKindReferenceId";

export function parseProvenanceTimelineTechnicalKindReferenceIdFromSearch(
  raw: string | null | undefined,
): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function provenanceTimelineTechnicalKindDisclosureHrefFromSearch(
  currentSearch: string,
  referenceId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (referenceId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(PROVENANCE_TIMELINE_TECHNICAL_KIND_REFERENCE_ID_PARAM);
  } else {
    params.set(PROVENANCE_TIMELINE_TECHNICAL_KIND_REFERENCE_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
