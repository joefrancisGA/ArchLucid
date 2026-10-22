import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { auditTrailActionHrefFromSearch } from "@/lib/governance/audit-trail-filters-url";

export const AUDIT_BUYER_HEADER_METRIC_ACTION_FILTERS = {
  decisions: "finding.approved",
  evidenceChanges: "findings.snapshot.created",
  approvals: "com.archlucid.governance.approval.recorded",
  exports: "artifact.bundle.created",
} as const;

export type AuditBuyerHeaderMetricCategory = keyof typeof AUDIT_BUYER_HEADER_METRIC_ACTION_FILTERS | "total";

export function auditBuyerHeaderMetricHref(category: AuditBuyerHeaderMetricCategory): string {
  if (category === "total") {
    return GOVERNANCE_AUDIT_PATH;
  }

  return auditTrailActionHrefFromSearch("", AUDIT_BUYER_HEADER_METRIC_ACTION_FILTERS[category]);
}
