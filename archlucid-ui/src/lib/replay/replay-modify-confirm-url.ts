import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";

export const REPLAY_MODIFY_CONFIRM_PARAM = "replayModifyConfirm";

export function parseReplayModifyConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function replayModifyConfirmHrefFromSearch(
  currentSearch: string,
  confirmOpen: boolean,
  pathname: string = INTERNAL_REPLAY_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!confirmOpen) {
    params.delete(REPLAY_MODIFY_CONFIRM_PARAM);
  } else {
    params.set(REPLAY_MODIFY_CONFIRM_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
