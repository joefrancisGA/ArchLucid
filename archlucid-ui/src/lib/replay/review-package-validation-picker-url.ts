import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const REPLAY_PICKER_OPEN_PARAM = "replayPickerOpen";
export const REPLAY_PICKER_QUERY_PARAM = "replayPickerQ";

export type ReviewPackageValidationPickerUrlState = {
  readonly open: boolean;
  readonly query: string;
};

export function parseReplayPickerOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseReplayPickerQueryFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function reviewPackageValidationPickerHrefFromSearch(
  currentSearch: string,
  state: ReviewPackageValidationPickerUrlState,
  pathname: string = INTERNAL_REPLAY_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const query = state.query.trim();

    if (!state.open) {
      params.delete(REPLAY_PICKER_OPEN_PARAM);
      params.delete(REPLAY_PICKER_QUERY_PARAM);
    } else {
      params.set(REPLAY_PICKER_OPEN_PARAM, "1");

      if (query.length === 0) {
        params.delete(REPLAY_PICKER_QUERY_PARAM);
      } else {
        params.set(REPLAY_PICKER_QUERY_PARAM, query);
      }
    }
    },
  });
}
