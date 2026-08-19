import { describe, expect, it } from "vitest";

import { findReportProblemMailtoDriftFindings } from "../src/lib/report-problem-surfaces-guard";

const UI_ROOT = process.cwd();

describe("report-problem mailto drift guard (TB-791, warn-only)", () => {
  it("documents operator error surfaces that use mailto without a nearby Report problem affordance", () => {
    const findings = findReportProblemMailtoDriftFindings(UI_ROOT);

    if (findings.length > 0) {
      console.warn(
        "report-problem mailto drift (warn-only):",
        findings.map((finding) => `${finding.relativePath}:${finding.line}`).join(", "),
      );
    }

    expect(findings.length).toBeGreaterThanOrEqual(0);
  });
});
