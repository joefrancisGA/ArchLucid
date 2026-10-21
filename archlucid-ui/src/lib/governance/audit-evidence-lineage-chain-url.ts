import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const AUDIT_EVIDENCE_LINEAGE_CHAIN_OPEN_PARAM = "lineageChainOpen";

export function parseAuditEvidenceLineageChainOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  if (trimmed === "0" || trimmed === "false") {
    return false;
  }

  return trimmed === "1" || trimmed === "true";
}

/** Working seats default expanded; buyer-polished stays collapsed unless the URL is explicit. */
export function resolveAuditEvidenceLineageChainExpanded(
  raw: string | null | undefined,
  buyerPolishedShell: boolean,
): boolean {
  if (raw === null || raw === undefined) {
    return !buyerPolishedShell;
  }

  return parseAuditEvidenceLineageChainOpenFromSearch(raw);
}

export function auditEvidenceLineageChainHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    params.set(AUDIT_EVIDENCE_LINEAGE_CHAIN_OPEN_PARAM, open ? "1" : "0");
    },
  });
}
