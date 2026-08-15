/**
 * DEMO-ONLY illustrative KPIs — do not import from production `/dashboard`, `/sponsor`, or `/value-report` routes.
 * Production tiles use `SponsorRoiDashboardLiveKpiCards`, `BusinessImpactSummaryWidget`, and live ROI APIs (TB-062 / Batch C).
 *
 * Guard: `sponsor-production-mock-kpi-guard.test.ts` fails if production routes import this module.
 */
export const SPONSOR_ROI_DASHBOARD_MOCK_KPIS_MODULE = "sponsor-roi-dashboard-mock-kpis";

export const sponsorRoiDashboardMockKpis = {
  architecturalDriftsPrevented: 12,
  compliancePosturePercent: 92,
  estimatedHoursSaved: 45,
} as const;
