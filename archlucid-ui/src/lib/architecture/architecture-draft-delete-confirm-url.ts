import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";

export const ARCHITECTURE_DRAFT_DELETE_ID_PARAM = "draftDeleteId";
export const ARCHITECTURE_DRAFT_DELETE_CONFIRM_PARAM = "draftDeleteConfirm";

export type ArchitectureDraftDeleteConfirmUrlState = {
  readonly draftId: string | null;
  readonly confirmOpen: boolean;
};

export function parseArchitectureDraftDeleteIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseArchitectureDraftDeleteConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureDraftDeleteConfirmHrefFromSearch(
  currentSearch: string,
  state: ArchitectureDraftDeleteConfirmUrlState,
  pathname: string = ARCHITECTURES_LIST_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const draftId = (state.draftId ?? "").trim();

  if (!state.confirmOpen || draftId.length === 0) {
    params.delete(ARCHITECTURE_DRAFT_DELETE_ID_PARAM);
    params.delete(ARCHITECTURE_DRAFT_DELETE_CONFIRM_PARAM);
  } else {
    params.set(ARCHITECTURE_DRAFT_DELETE_ID_PARAM, draftId);
    params.set(ARCHITECTURE_DRAFT_DELETE_CONFIRM_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
