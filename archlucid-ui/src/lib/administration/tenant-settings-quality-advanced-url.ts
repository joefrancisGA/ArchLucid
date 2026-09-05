import { SETTINGS_WORKSPACE_SETTINGS_PATH } from "@/lib/settings-admin-route-paths";

export const TENANT_SETTINGS_QUALITY_ADVANCED_OPEN_PARAM = "settingsQualityAdvancedOpen";

export function parseTenantSettingsQualityAdvancedOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function tenantSettingsQualityAdvancedHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string = SETTINGS_WORKSPACE_SETTINGS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(TENANT_SETTINGS_QUALITY_ADVANCED_OPEN_PARAM);
  } else {
    params.set(TENANT_SETTINGS_QUALITY_ADVANCED_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
