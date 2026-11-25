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
});