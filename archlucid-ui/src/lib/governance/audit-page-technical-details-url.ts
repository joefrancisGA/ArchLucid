import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const AUDIT_PAGE_TECHNICAL_DETAILS_OPEN_PARAM = "auditTechnicalDetailsOpen";

export function parseAuditPageTechnicalDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function auditPageTechnicalDetailsHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string = GOVERNANCE_AUDIT_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!open) {
      params.delete(AUDIT_PAGE_TECHNICAL_DETAILS_OPEN_PARAM);
    } else {
      params.set(AUDIT_PAGE_TECHNICAL_DETAILS_OPEN_PARAM, "1");
    }
    },
  });
}
