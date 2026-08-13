/** Drill-through targets for executive dashboard KPI tiles (TB-244). */

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";

export const EXECUTIVE_KPI_DRILL_THROUGH = {
  resolvedFindings30d: "/architecture/reviews",
  newlyDiscoveredFindings30d: "/governance/findings",
  staleArchitectureRisks: "/governance/findings?filter=stale",
  decisionsNeeded: "/governance/findings",
  expiringWaivers: "/governance/exceptions",
  findingsRemediated30d: "/governance/findings",
  costEvidenceFreshness: "/insights/pilot-outcomes",
  orphanCandidates: "/architecture/reviews?filter=orphan-candidates",
  sqlBackupRegion: `${EXECUTIVE_DASHBOARD_HREF}#executive-sql-backup-region-verification`,
  complianceDrift: GOVERNANCE_WORKSPACE_HEALTH_HREF,
} as const;
