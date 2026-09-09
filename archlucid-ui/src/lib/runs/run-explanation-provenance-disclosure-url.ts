export const RUN_EXPLANATION_PROVENANCE_OPEN_PARAM = "runExplanationProvenanceOpen";

export function parseRunExplanationProvenanceOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function runExplanationProvenanceDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(RUN_EXPLANATION_PROVENANCE_OPEN_PARAM);
  } else {
    params.set(RUN_EXPLANATION_PROVENANCE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
