import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const WORKSPACE_MODE_SWITCH_CONFIRM_PARAM = "workspaceSwitchConfirm";

export function parseWorkspaceModeSwitchConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function workspaceModeSwitchConfirmHrefFromSearch(
  currentSearch: string,
  confirmOpen: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, confirmOpen, pathname, WORKSPACE_MODE_SWITCH_CONFIRM_PARAM);
}
