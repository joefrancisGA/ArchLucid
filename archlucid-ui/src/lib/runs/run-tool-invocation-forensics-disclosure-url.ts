import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RUN_TOOL_INVOCATION_FORENSICS_OPEN_PARAM = "runToolInvocationForensicsOpen";

export function parseRunToolInvocationForensicsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function runToolInvocationForensicsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, RUN_TOOL_INVOCATION_FORENSICS_OPEN_PARAM);
}
