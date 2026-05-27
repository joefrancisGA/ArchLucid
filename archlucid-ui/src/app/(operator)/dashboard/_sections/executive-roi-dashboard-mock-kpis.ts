/**
 * DEMO-ONLY illustrative KPIs — do not import from production `/dashboard` or `/executive` routes.
 * Production tiles use `ExecutiveRoiDashboardLiveKpiCards` and live APIs (TB-062).
 */
export const EXECUTIVE_ROI_DASHBOARD_MOCK_KPIS_MODULE = "executive-roi-dashboard-mock-kpis";

export const executiveRoiDashboardMockKpis = {
  architecturalDriftsPrevented: 12,
  compliancePosturePercent: 92,
  estimatedHoursSaved: 45,
} as const;
