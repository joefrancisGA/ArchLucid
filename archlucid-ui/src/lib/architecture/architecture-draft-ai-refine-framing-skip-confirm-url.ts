import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, confirmOpen, pathname, ARCHITECTURE_DRAFT_AI_REFINE_FRAMING_SKIP_CONFIRM_PARAM);
}
