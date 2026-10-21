import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const AUDIT_TRAIL_RUN_ID_PARAM = "runId";

export function parseAuditTrailRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function auditTrailRunIdHrefFromSearch(
  currentSearch: string,
  runId: string,
  pathname: string = GOVERNANCE_AUDIT_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = runId.trim();

    if (trimmed.length === 0) {
      params.delete(AUDIT_TRAIL_RUN_ID_PARAM);
    } else {
      params.set(AUDIT_TRAIL_RUN_ID_PARAM, trimmed);
    }
    },
  });
}
