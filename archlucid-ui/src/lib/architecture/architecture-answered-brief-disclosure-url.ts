export const ARCHITECTURE_ANSWERED_BRIEF_OPEN_PARAM = "architectureAnsweredBriefOpen";

export function parseArchitectureAnsweredBriefOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureAnsweredBriefDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ARCHITECTURE_ANSWERED_BRIEF_OPEN_PARAM);
  } else {
    params.set(ARCHITECTURE_ANSWERED_BRIEF_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
