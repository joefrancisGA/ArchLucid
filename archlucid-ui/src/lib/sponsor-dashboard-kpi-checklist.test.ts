import { describe, expect, it } from "vitest";

import {
  resolveSponsorDashboardKpiEmphasizedStepId,
  resolveSponsorDashboardKpiSteps,
} from "./sponsor-dashboard-kpi-checklist";

describe("sponsor-dashboard-kpi-checklist", () => {
  it("emphasizes KPI review when review is picked but KPIs are not reviewed", () => {
    expect(
      resolveSponsorDashboardKpiEmphasizedStepId({
        reviewPicked: true,
        kpisReviewed: false,
        exportReady: false,
      }),
    ).toBe("kpis");
  });

  it("marks all steps complete when export is ready", () => {
    const steps = resolveSponsorDashboardKpiSteps({
      reviewPicked: true,
      kpisReviewed: true,
      exportReady: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
    expect(
      resolveSponsorDashboardKpiEmphasizedStepId({
        reviewPicked: true,
        kpisReviewed: true,
        exportReady: true,
      }),
    ).toBe("export");
  });
});
