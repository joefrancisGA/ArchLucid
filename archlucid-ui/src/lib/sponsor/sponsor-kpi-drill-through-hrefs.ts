/** Drill-through targets for sponsor dashboard KPI tiles (TB-244). */

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";

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
