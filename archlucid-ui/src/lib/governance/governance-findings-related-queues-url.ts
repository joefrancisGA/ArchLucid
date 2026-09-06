export const GOVERNANCE_FINDINGS_RELATED_QUEUES_OPEN_PARAM = "governanceFindingsRelatedQueuesOpen";

export function parseGovernanceFindingsRelatedQueuesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function governanceFindingsRelatedQueuesHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(GOVERNANCE_FINDINGS_RELATED_QUEUES_OPEN_PARAM);
  } else {
    params.set(GOVERNANCE_FINDINGS_RELATED_QUEUES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
