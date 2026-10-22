import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!confirmOpen) {
      params.delete(REPLAY_MODIFY_CONFIRM_PARAM);
    } else {
      params.set(REPLAY_MODIFY_CONFIRM_PARAM, "1");
    }
    },
  });
}
