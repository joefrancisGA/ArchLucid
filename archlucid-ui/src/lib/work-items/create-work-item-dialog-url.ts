export const CREATE_WORK_ITEM_OPEN_PARAM = "workItemOpen";
export const CREATE_WORK_ITEM_FINDING_ID_PARAM = "workItemFindingId";

export type CreateWorkItemDialogUrlState = {
  readonly open: boolean;
  readonly findingId: string | null;
};

export function parseCreateWorkItemOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseCreateWorkItemFindingIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function createWorkItemDialogHrefFromSearch(
  currentSearch: string,
  state: CreateWorkItemDialogUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!state.open) {
    params.delete(CREATE_WORK_ITEM_OPEN_PARAM);
    params.delete(CREATE_WORK_ITEM_FINDING_ID_PARAM);
  } else {
    params.set(CREATE_WORK_ITEM_OPEN_PARAM, "1");

    const findingId = (state.findingId ?? "").trim();

    if (findingId.length === 0) {
      params.delete(CREATE_WORK_ITEM_FINDING_ID_PARAM);
    } else {
      params.set(CREATE_WORK_ITEM_FINDING_ID_PARAM, findingId);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
