/** Drill-through targets for executive dashboard KPI tiles (TB-244). */

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";

export const EXECUTIVE_KPI_DRILL_THROUGH = {
  resolvedFindings30d: "/reviews",
  newlyDiscoveredFindings30d: "/governance/findings",
  staleArchitectureRisks: "/governance/findings?filter=stale",
  decisionsNeeded: "/governance/findings",
  expiringWaivers: "/governance/risk-exceptions",
  findingsRemediated30d: "/governance/findings",
  costEvidenceFreshness: "/sponsor-report/pilot-outcomes",
  orphanCandidates: "/reviews?filter=orphan-candidates",
  sqlBackupRegion: `${EXECUTIVE_DASHBOARD_HREF}#executive-sql-backup-region-verification`,
  complianceDrift: "/governance/dashboard",
} as const;
