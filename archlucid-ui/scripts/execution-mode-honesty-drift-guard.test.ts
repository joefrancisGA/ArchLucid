import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  displayLabelNeverPromotesToReal,
  EXECUTION_MODE_HONESTY_DRIFT_GUARD_SOURCES,
  EXECUTION_MODE_ROI_PERIOD_MIX_FOOTNOTE,
  EXECUTION_MODE_WITHIN_RUN_MIXED_BADGE_MARKER,
  findExecutionModeHonestyViolations,
  isBuyerRealEvidenceMode,
  withinRunMixedBadgeCopy,
} from "@/lib/execution-mode-honesty";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

const UI_ROOT = process.cwd();

function readUiFile(relativePath: string): string {
  return readFileSync(join(UI_ROOT, relativePath), "utf8");
}

describe("execution-mode honesty (TB-971)", () => {
  it("keeps ROI period-mix footnote distinct from within-run Mixed badge copy", () => {
    expect(EXECUTION_MODE_ROI_PERIOD_MIX_FOOTNOTE).toContain("reporting period");
    expect(withinRunMixedBadgeCopy()).toContain(EXECUTION_MODE_WITHIN_RUN_MIXED_BADGE_MARKER);
    expect(EXECUTION_MODE_ROI_PERIOD_MIX_FOOTNOTE).not.toContain(EXECUTION_MODE_WITHIN_RUN_MIXED_BADGE_MARKER);
  });

  it("never promotes non-Real modes to Real display labels", () => {
    expect(displayLabelNeverPromotesToReal(StructuralExecutionModeWire.Real, "Real")).toBe(true);
    expect(displayLabelNeverPromotesToReal(StructuralExecutionModeWire.Mixed, "Mixed")).toBe(true);
    expect(displayLabelNeverPromotesToReal(StructuralExecutionModeWire.Mixed, "Real")).toBe(false);
    expect(displayLabelNeverPromotesToReal(StructuralExecutionModeWire.Fallback, "Real")).toBe(false);
  });

  it("treats only Real as buyer real-evidence mode", () => {
    expect(isBuyerRealEvidenceMode(StructuralExecutionModeWire.Real)).toBe(true);
    expect(isBuyerRealEvidenceMode(StructuralExecutionModeWire.Mixed)).toBe(false);
  });

  it("guards wired surfaces against promotion and inline ROI footnote drift", () => {
    for (const relativePath of EXECUTION_MODE_HONESTY_DRIFT_GUARD_SOURCES) {
      const source = readUiFile(relativePath);
      const violations = findExecutionModeHonestyViolations(source, relativePath);

      expect(violations, relativePath).toEqual([]);
    }
  });
});
