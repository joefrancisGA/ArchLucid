import { describe, expect, it } from "vitest";

import {
  REPORT_PROBLEM_V1_SURFACES,
  findReportProblemSurfaceById,
  isReportProblemEnabledForApiProblemFailure,
  isReportProblemEnabledForConnectivityError,
  pathnameMatchesReportProblemRoute,
  reportProblemSurfacesForPathname,
} from "@/lib/report-problem-surfaces";

describe("report-problem-surfaces (TB-782)", () => {
  it("lists initial high-stakes surfaces with component paths", () => {
    expect(REPORT_PROBLEM_V1_SURFACES.length).toBeGreaterThanOrEqual(8);
    expect(findReportProblemSurfaceById("reviews-hub-unexpected-response")).toBeDefined();
    expect(findReportProblemSurfaceById("operator-api-problem-high-stakes")?.componentPath).toContain(
      "OperatorApiProblem.tsx",
    );
  });

  it("matches static and dynamic route patterns", () => {
    expect(pathnameMatchesReportProblemRoute("/reviews", "/reviews")).toBe(true);
    expect(pathnameMatchesReportProblemRoute("/reviews", "/reviews/")).toBe(true);
    expect(pathnameMatchesReportProblemRoute("/reviews", "/reviews/abc-123")).toBe(false);
    expect(pathnameMatchesReportProblemRoute("/reviews/[runId]", "/reviews/abc-123")).toBe(true);
    expect(pathnameMatchesReportProblemRoute("/reviews/[runId]", "/reviews/new")).toBe(false);
    expect(pathnameMatchesReportProblemRoute("/value-report", "/value-report/pilot", "exact-or-child")).toBe(
      true,
    );
  });

  it("returns route-scoped surfaces plus global component surfaces", () => {
    const surfaces = reportProblemSurfacesForPathname("/reviews/abc-123");
    const ids = surfaces.map((surface) => surface.id);

    expect(ids).toContain("review-detail-hard-load-failure");
    expect(ids).toContain("operator-api-problem-high-stakes");
    expect(reportProblemSurfacesForPathname("/reviews/new").map((surface) => surface.id)).not.toContain(
      "review-detail-hard-load-failure",
    );
  });

  it("excludes validation-only HTTP 400 from api-problem Report problem (TB-785)", () => {
    expect(
      isReportProblemEnabledForApiProblemFailure({ httpStatus: 400, isValidationFailure: true }),
    ).toBe(false);
    expect(
      isReportProblemEnabledForApiProblemFailure({ httpStatus: 503, isValidationFailure: false }),
    ).toBe(true);
  });

  it("enables connectivity error Report problem when registry entry exists (TB-785)", () => {
    expect(isReportProblemEnabledForConnectivityError()).toBe(true);
  });
});
