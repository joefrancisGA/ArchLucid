import { describe, expect, it } from "vitest";

import {
  attackPathReportPathChipOverflowLine,
  formatAttackPathReportPathChipLabel,
} from "@/lib/remediation-factory/attack-path-report-path-chip-label";

describe("attack-path-report-path-chip-label", () => {
  it("returns a lone ellipsis path id without adding a second ellipsis", () => {
    expect(formatAttackPathReportPathChipLabel("…")).toBe("…");
    expect(formatAttackPathReportPathChipLabel("...")).toBe("...");
  });

  it("returns null overflow line when every path id is short", () => {
    expect(attackPathReportPathChipOverflowLine(["path-a", "path-b"])).toBeNull();
  });

  it("ellipsizes a 29-character path id while keeping a 28-character id verbatim", () => {
    const atBoundary = "a".repeat(28);
    const overBoundary = "a".repeat(29);

    expect(formatAttackPathReportPathChipLabel(atBoundary)).toBe(atBoundary);
    expect(formatAttackPathReportPathChipLabel(overBoundary)).toContain("…");
    expect(formatAttackPathReportPathChipLabel(overBoundary).length).toBeLessThan(overBoundary.length);
  });

  it("returns null overflow line for an empty path id list", () => {
    expect(attackPathReportPathChipOverflowLine([])).toBeNull();
  });
});