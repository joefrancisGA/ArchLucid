import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, GOVERNANCE_FINDINGS_RELATED_QUEUES_OPEN_PARAM);
}
