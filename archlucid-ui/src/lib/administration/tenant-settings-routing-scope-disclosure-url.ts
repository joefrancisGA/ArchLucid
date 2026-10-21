import { SETTINGS_WORKSPACE_SETTINGS_PATH } from "@/lib/settings-admin-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const TENANT_SETTINGS_ROUTING_SCOPE_OPEN_PARAM = "tenantSettingsRoutingScopeOpen";

export function parseTenantSettingsRoutingScopeOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function tenantSettingsRoutingScopeDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string = SETTINGS_WORKSPACE_SETTINGS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!open) {
      params.delete(TENANT_SETTINGS_ROUTING_SCOPE_OPEN_PARAM);
    } else {
      params.set(TENANT_SETTINGS_ROUTING_SCOPE_OPEN_PARAM, "1");
    }
    },
  });
}
