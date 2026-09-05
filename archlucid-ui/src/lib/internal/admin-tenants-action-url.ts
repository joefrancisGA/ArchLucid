import { INTERNAL_TENANTS_PATH } from "@/lib/internal-ops-route-paths";

export const ADMIN_TENANT_ID_PARAM = "tenantId";
export const ADMIN_TENANT_ACTION_PARAM = "tenantAction";

export const ADMIN_TENANT_ACTION_OPTIONS = ["shut-off", "turn-on"] as const;

export type AdminTenantActionKind = (typeof ADMIN_TENANT_ACTION_OPTIONS)[number];

const ADMIN_TENANT_ACTION_IDS = new Set<string>(ADMIN_TENANT_ACTION_OPTIONS);

export type AdminTenantsActionUrlState = {
  readonly tenantId: string | null;
  readonly action: AdminTenantActionKind | null;
};

export function parseAdminTenantIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseAdminTenantActionFromSearch(raw: string | null | undefined): AdminTenantActionKind | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!ADMIN_TENANT_ACTION_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as AdminTenantActionKind;
}

export function adminTenantsActionHrefFromSearch(
  currentSearch: string,
  state: AdminTenantsActionUrlState,
  pathname: string = INTERNAL_TENANTS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const tenantId = (state.tenantId ?? "").trim();

  if (tenantId.length === 0 || state.action === null) {
    params.delete(ADMIN_TENANT_ID_PARAM);
    params.delete(ADMIN_TENANT_ACTION_PARAM);
  } else {
    params.set(ADMIN_TENANT_ID_PARAM, tenantId);
    params.set(ADMIN_TENANT_ACTION_PARAM, state.action);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
