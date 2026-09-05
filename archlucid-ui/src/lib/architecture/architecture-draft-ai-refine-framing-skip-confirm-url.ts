export const ARCHITECTURE_DRAFT_AI_REFINE_FRAMING_SKIP_CONFIRM_PARAM = "aiRefineFramingSkipConfirm";

export function parseArchitectureDraftAiRefineFramingSkipConfirmOpenFromSearch(
  raw: string | null | undefined,
): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureDraftAiRefineFramingSkipConfirmHrefFromSearch(
  currentSearch: string,
  confirmOpen: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!confirmOpen) {
    params.delete(ARCHITECTURE_DRAFT_AI_REFINE_FRAMING_SKIP_CONFIRM_PARAM);
  } else {
    params.set(ARCHITECTURE_DRAFT_AI_REFINE_FRAMING_SKIP_CONFIRM_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
