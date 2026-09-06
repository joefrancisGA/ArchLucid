export const API_KEYS_TECHNICAL_DETAILS_OPEN_PARAM = "apiKeysTechnicalDetailsOpen";

export function parseApiKeysTechnicalDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function apiKeysTechnicalDetailsHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string = "/administration/api-keys",
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(API_KEYS_TECHNICAL_DETAILS_OPEN_PARAM);
  } else {
    params.set(API_KEYS_TECHNICAL_DETAILS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
