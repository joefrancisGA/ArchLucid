import { INTERNAL_OPERATIONAL_ERRORS_PATH } from "@/lib/internal-ops-route-paths";

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
  const params = new URLSearchParams(currentSearch);
  const trimmed = (errorId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(OPERATIONAL_ERRORS_DETAIL_PARAM);
  } else {
    params.set(OPERATIONAL_ERRORS_DETAIL_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
