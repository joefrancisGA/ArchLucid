export const ITSM_OUTBOUND_CREATE_OPEN_PARAM = "itsmCreateOpen";
export const ITSM_OUTBOUND_CREATE_FINDING_ID_PARAM = "itsmCreateFindingId";

export type ItsmOutboundCreateIssuePanelsUrlState = {
  readonly open: boolean;
  readonly findingId: string | null;
};

export function parseItsmOutboundCreateOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseItsmOutboundCreateFindingIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function itsmOutboundCreateIssuePanelsHrefFromSearch(
  currentSearch: string,
  state: ItsmOutboundCreateIssuePanelsUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const findingId = (state.findingId ?? "").trim();

  if (!state.open || findingId.length === 0) {
    params.delete(ITSM_OUTBOUND_CREATE_OPEN_PARAM);
    params.delete(ITSM_OUTBOUND_CREATE_FINDING_ID_PARAM);
  } else {
    params.set(ITSM_OUTBOUND_CREATE_OPEN_PARAM, "1");
    params.set(ITSM_OUTBOUND_CREATE_FINDING_ID_PARAM, findingId);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
