/** Drill-through targets for sponsor dashboard KPI tiles (TB-244). */

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { remapGovernanceOperatorHref } from "@/lib/product-line/securenow-compliance-routes";

export const SPONSOR_KPI_DRILL_THROUGH = {
  resolvedFindings30d: "/architecture/reviews",
  newlyDiscoveredFindings30d: "/governance/findings?filter=open",
  staleArchitectureRisks: "/governance/findings?filter=stale",
  decisionsNeeded: "/governance/findings?filter=needs-decision",
  expiringWaivers: "/governance/exceptions",
  findingsRemediated30d: "/governance/findings",
  costEvidenceFreshness: "/insights/sponsor-report",
  orphanCandidates: "/architecture/reviews?filter=orphan-candidates",
  sqlBackupRegion: `${SPONSOR_DASHBOARD_HREF}#sponsor-sql-backup-region-verification`,
  complianceDrift: GOVERNANCE_WORKSPACE_HEALTH_HREF,
} as const;

export type SponsorKpiDrillThroughMap = {
  readonly [Key in keyof typeof SPONSOR_KPI_DRILL_THROUGH]: string;
};

export function resolveSponsorKpiDrillThrough(productLine: ProductLineId): SponsorKpiDrillThroughMap {
  return {
    resolvedFindings30d: SPONSOR_KPI_DRILL_THROUGH.resolvedFindings30d,
    newlyDiscoveredFindings30d: remapGovernanceOperatorHref(
      SPONSOR_KPI_DRILL_THROUGH.newlyDiscoveredFindings30d,
      productLine,
    ),
    staleArchitectureRisks: remapGovernanceOperatorHref(SPONSOR_KPI_DRILL_THROUGH.staleArchitectureRisks, productLine),
    decisionsNeeded: remapGovernanceOperatorHref(SPONSOR_KPI_DRILL_THROUGH.decisionsNeeded, productLine),
    expiringWaivers: SPONSOR_KPI_DRILL_THROUGH.expiringWaivers,
    findingsRemediated30d: remapGovernanceOperatorHref(SPONSOR_KPI_DRILL_THROUGH.findingsRemediated30d, productLine),
    costEvidenceFreshness: SPONSOR_KPI_DRILL_THROUGH.costEvidenceFreshness,
    orphanCandidates: SPONSOR_KPI_DRILL_THROUGH.orphanCandidates,
    sqlBackupRegion: SPONSOR_KPI_DRILL_THROUGH.sqlBackupRegion,
    complianceDrift: SPONSOR_KPI_DRILL_THROUGH.complianceDrift,
  };
}
