import { describe, expect, it } from "vitest";

import {
  REPORT_PROBLEM_V1_SURFACES,
  findReportProblemSurfaceById,
  isReportProblemEnabledForApiProblemFailure,
  isReportProblemEnabledForConnectivityError,
  isReportProblemEnabledForSurface,
  pathnameMatchesReportProblemRoute,
  reportProblemSurfacesForPathname,
} from "@/lib/report-problem-surfaces";
import {
  findReportProblemMailtoDriftFindings,
  findReportProblemSurfaceGuardViolations,
  readSurfaceSourceBundle,
  REPORT_PROBLEM_SURFACE_WIRING_RULES,
} from "@/lib/report-problem-surfaces-guard";

const UI_ROOT = process.cwd();

describe("report-problem-surfaces (TB-782)", () => {
  it("lists initial high-stakes surfaces with component paths", () => {
    expect(REPORT_PROBLEM_V1_SURFACES.length).toBeGreaterThanOrEqual(8);
    expect(findReportProblemSurfaceById("reviews-hub-unexpected-response")).toBeDefined();
    expect(findReportProblemSurfaceById("operator-api-problem-high-stakes")?.componentPath).toContain(
      "OperatorApiProblem.tsx",
    );
  });

  it("matches static and dynamic route patterns", () => {
    expect(pathnameMatchesReportProblemRoute("/architecture/reviews", "/architecture/reviews")).toBe(true);
    expect(pathnameMatchesReportProblemRoute("/architecture/reviews", "/architecture/reviews/")).toBe(true);
    expect(pathnameMatchesReportProblemRoute("/architecture/reviews", "/architecture/reviews/abc-123")).toBe(false);
    expect(pathnameMatchesReportProblemRoute("/architecture/reviews/[runId]", "/architecture/reviews/abc-123")).toBe(true);
    expect(pathnameMatchesReportProblemRoute("/architecture/reviews/[runId]", "/architecture/reviews/new")).toBe(false);
    expect(
      pathnameMatchesReportProblemRoute(
        "/insights/executive-summary",
        "/insights/executive-summary/print",
        "exact-or-child",
      ),
    ).toBe(true);
    expect(
      pathnameMatchesReportProblemRoute(
        "/insights/executive-summary",
        "exact-or-child",
      ),
    ).toBe(false);
  });

  it("returns route-scoped surfaces plus global component surfaces", () => {
    const surfaces = reportProblemSurfacesForPathname("/architecture/reviews/abc-123");
    const ids = surfaces.map((surface) => surface.id);

    expect(ids).toContain("review-detail-hard-load-failure");
    expect(ids).toContain("operator-api-problem-high-stakes");
    expect(reportProblemSurfacesForPathname("/architecture/reviews/new").map((surface) => surface.id)).not.toContain(
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

  it("enables fatal page surfaces by registry id (TB-786)", () => {
    expect(isReportProblemEnabledForSurface("reviews-hub-unexpected-response")).toBe(true);
    expect(isReportProblemEnabledForSurface("unknown-surface")).toBe(false);
  });
});

describe("report-problem-surfaces guard (TB-791)", () => {
  it("keeps a wiring rule for every registry surface", () => {
    const wiredIds = new Set(REPORT_PROBLEM_SURFACE_WIRING_RULES.map((rule) => rule.surfaceId));

    for (const surface of REPORT_PROBLEM_V1_SURFACES) {
      expect(wiredIds.has(surface.id), surface.id).toBe(true);
    }
  });

  it("keeps registry component paths on disk with expected Report problem wiring", () => {
    const violations = findReportProblemSurfaceGuardViolations(UI_ROOT);

    expect(violations).toEqual([]);
  });

  it("readSurfaceSourceBundle returns file contents without exists-then-read", () => {
    const source = readSurfaceSourceBundle(UI_ROOT, "components/operator/OperatorApiProblem.tsx");

    expect(source.length).toBeGreaterThan(0);
    expect(source).toContain("OperatorApiProblem");
  });

  it("readSurfaceSourceBundle returns empty string for missing paths", () => {
    expect(readSurfaceSourceBundle(UI_ROOT, "components/__missing__.tsx")).toBe("");
  });

  it("warns only (does not fail) when operator error surfaces add mailto without Report problem nearby", () => {
    const findings = findReportProblemMailtoDriftFindings(UI_ROOT);

    if (findings.length > 0) {
      // Warn-only guard: surface drift in CI output without blocking merges.
      console.warn(
        "report-problem mailto drift (warn-only):",
        findings.map((finding) => `${finding.relativePath}:${finding.line}`).join(", "),
      );
    }

    expect(findings.length).toBeGreaterThanOrEqual(0);
  });
});
