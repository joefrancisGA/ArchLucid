/**
 * DEMO-ONLY illustrative KPIs — do not import from production `/dashboard`, `/executive`, or `/value-report` routes.
 * Production tiles use `ExecutiveRoiDashboardLiveKpiCards`, `BusinessImpactSummaryWidget`, and live ROI APIs (TB-062 / Batch C).
 *
 * Guard: `executive-production-mock-kpi-guard.test.ts` fails if production routes import this module.
 */
export const EXECUTIVE_ROI_DASHBOARD_MOCK_KPIS_MODULE = "executive-roi-dashboard-mock-kpis";

export const executiveRoiDashboardMockKpis = {
  architecturalDriftsPrevented: 12,
  compliancePosturePercent: 92,
  estimatedHoursSaved: 45,
} as const;
