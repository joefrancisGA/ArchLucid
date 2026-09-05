export const OPERATOR_WELCOME_OPEN_PARAM = "welcomeOpen";

export function parseOperatorWelcomeOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function operatorWelcomeOnboardingHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(OPERATOR_WELCOME_OPEN_PARAM);
  } else {
    params.set(OPERATOR_WELCOME_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

/** True when the current query already encodes `open` — skip a no-op App Router replace. */
export function operatorWelcomeOnboardingUrlAlreadyMatches(currentSearch: string, open: boolean): boolean {
  const params = new URLSearchParams(currentSearch);

  return parseOperatorWelcomeOpenFromSearch(params.get(OPERATOR_WELCOME_OPEN_PARAM)) === open;
}
