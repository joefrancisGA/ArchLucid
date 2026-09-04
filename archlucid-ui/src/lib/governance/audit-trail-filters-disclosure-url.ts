import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const AUDIT_TRAIL_ADVANCED_FILTERS_PARAM = "advanced";
export const AUDIT_TRAIL_PRIMARY_FILTERS_PARAM = "primaryFilters";

export function parseAuditTrailAdvancedFiltersOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseAuditTrailPrimaryFiltersOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function auditTrailFiltersDisclosureHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly advancedAuditFiltersOpen?: boolean;
    readonly buyerPrimaryFiltersOpen?: boolean;
  },
  pathname: string = GOVERNANCE_AUDIT_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (patch.advancedAuditFiltersOpen !== undefined) {
    if (!patch.advancedAuditFiltersOpen) {
      params.delete(AUDIT_TRAIL_ADVANCED_FILTERS_PARAM);
    } else {
      params.set(AUDIT_TRAIL_ADVANCED_FILTERS_PARAM, "1");
    }
  }

  if (patch.buyerPrimaryFiltersOpen !== undefined) {
    if (!patch.buyerPrimaryFiltersOpen) {
      params.delete(AUDIT_TRAIL_PRIMARY_FILTERS_PARAM);
    } else {
      params.set(AUDIT_TRAIL_PRIMARY_FILTERS_PARAM, "1");
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
