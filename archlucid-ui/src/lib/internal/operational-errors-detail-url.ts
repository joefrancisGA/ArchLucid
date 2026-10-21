import { INTERNAL_OPERATIONAL_ERRORS_PATH } from "@/lib/internal-ops-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const OPERATIONAL_ERRORS_DETAIL_PARAM = "errorId";

export function parseOperationalErrorsDetailIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function operationalErrorsDetailHrefFromSearch(
  currentSearch: string,
  errorId: string | null,
  pathname: string = INTERNAL_OPERATIONAL_ERRORS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (errorId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(OPERATIONAL_ERRORS_DETAIL_PARAM);
    } else {
      params.set(OPERATIONAL_ERRORS_DETAIL_PARAM, trimmed);
    }
    },
  });
}
