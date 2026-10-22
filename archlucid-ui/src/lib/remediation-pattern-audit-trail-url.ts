import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { AUDIT_TRAIL_SEARCH_PARAM } from "@/lib/governance/audit-trail-filters-url";

/** Audit trail search scoped to one remediation pattern version (correlation-style `q` filter). */
export function remediationPatternVersionAuditTrailHref(
  patternId: string,
  version: string,
  patternKey?: string | null,
): string {
  const trimmedPatternId = patternId.trim();
  const trimmedVersion = version.trim();
  const trimmedKey = patternKey?.trim() ?? "";

  const queryParts = [trimmedKey, trimmedPatternId, `v${trimmedVersion}`].filter((part) => part.length > 0);
  const params = new URLSearchParams();

  params.set(AUDIT_TRAIL_SEARCH_PARAM, queryParts.join(" "));

  return `${GOVERNANCE_AUDIT_PATH}?${params.toString()}`;
}
