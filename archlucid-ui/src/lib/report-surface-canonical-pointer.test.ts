import { describe, expect, it } from "vitest";

import { resolveReportSurfaceCanonicalPointer } from "@/lib/report-surface-canonical-pointer";

describe("report-surface-canonical-pointer (CD-09)", () => {
  it("points architecture scorecard readers at sponsor report", () => {
    const pointer = resolveReportSurfaceCanonicalPointer("architecture-scorecard");

    expect(pointer?.canonicalHref).toBe("/insights/sponsor-report");
    expect(pointer?.canonicalLabel).toBe("Sponsor report");
  });

  it("points sponsor dashboard readers at sponsor report", () => {
    const pointer = resolveReportSurfaceCanonicalPointer("sponsor-dashboard");

    expect(pointer?.canonicalHref).toBe("/insights/sponsor-report");
  });

  it("points sponsor report readers at architecture scorecard for per-review KPIs", () => {
    const pointer = resolveReportSurfaceCanonicalPointer("sponsor-report");

    expect(pointer?.canonicalHref).toContain("architecture-scorecard");
  });
});
