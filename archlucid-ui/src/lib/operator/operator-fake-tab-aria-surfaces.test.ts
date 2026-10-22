import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { OPERATOR_FAKE_TAB_ARIA_TB1664_SURFACES } from "@/lib/operator/operator-fake-tab-aria-surfaces";

const SRC_ROOT = join(process.cwd(), "src");

function readSrcModule(relativePath: string): string {
  return readFileSync(join(SRC_ROOT, relativePath), "utf8");
}

describe("operator-fake-tab-aria-surfaces (TB-1664)", () => {
  it("tracks every TB-1664 named surface module", () => {
    expect(OPERATOR_FAKE_TAB_ARIA_TB1664_SURFACES.map((entry) => entry.id)).toEqual([
      "value-report-outcomes-nav",
      "alert-simulation-modes",
    ]);
  });

  it("value report outcomes nav does not claim tab semantics (TB-1664)", () => {
    const source = readSrcModule("components/usability/ValueReportOutcomesNav.tsx");

    expect(source).not.toMatch(/role\s*=\s*["']tablist["']/);
    expect(source).not.toMatch(/role\s*=\s*["']tab["']/);
    expect(source).toMatch(/aria-current=\{active \? "page" : undefined\}/);
  });

  it("alert simulation uses segmented mode toolbar, not fake tabs (TB-1664)", () => {
    const source = readSrcModule("components/alerts/AlertSimulationContent.tsx");

    expect(source).not.toMatch(/role\s*=\s*["']tablist["']/);
    expect(source).not.toMatch(/role\s*=\s*["']tab["']/);
    expect(source).toContain("OperatorSegmentedModeToolbar");
  });
});
