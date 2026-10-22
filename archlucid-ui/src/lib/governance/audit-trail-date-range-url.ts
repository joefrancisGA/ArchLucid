import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
import {
  AUDIT_TRAIL_FROM_PARAM,
  AUDIT_TRAIL_TO_PARAM,
} from "@/lib/governance/audit-trail-custom-date-url";

export const AUDIT_TRAIL_DATE_RANGE_PARAM = "range";

export type AuditTrailDateRangePreset = "24h" | "7d";

const AUDIT_TRAIL_DATE_RANGE_IDS = new Set<string>(["24h", "7d"]);

export function parseAuditTrailDateRangePresetFromSearch(
  raw: string | null | undefined,
): AuditTrailDateRangePreset | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!AUDIT_TRAIL_DATE_RANGE_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as AuditTrailDateRangePreset;
}

export function auditTrailDateRangePresetHrefFromSearch(
  currentSearch: string,
  preset: AuditTrailDateRangePreset | null,
  pathname: string = GOVERNANCE_AUDIT_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (preset === null) {
      params.delete(AUDIT_TRAIL_DATE_RANGE_PARAM);
    } else {
      params.set(AUDIT_TRAIL_DATE_RANGE_PARAM, preset);
      params.delete(AUDIT_TRAIL_FROM_PARAM);
      params.delete(AUDIT_TRAIL_TO_PARAM);
    }
    },
  });
}
