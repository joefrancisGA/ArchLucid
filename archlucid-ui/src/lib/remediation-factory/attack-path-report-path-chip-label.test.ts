import { describe, expect, it } from "vitest";

import {
  attackPathReportPathChipOverflowLine,
  formatAttackPathReportPathChipLabel,
} from "@/lib/remediation-factory/attack-path-report-path-chip-label";

describe("attack-path-report-path-chip-label", () => {

  it("preserves interior horizontal tab in a short path id", () => {
    expect(formatAttackPathReportPathChipLabel("ab\tcd")).toBe("ab\tcd");
  });
  it("returns a lone ellipsis path id without adding a second ellipsis", () => {
    expect(formatAttackPathReportPathChipLabel("…")).toBe("…");
    expect(formatAttackPathReportPathChipLabel("...")).toBe("...");
  });


  it("preserves interior newline in a short path id", () => {
    expect(formatAttackPathReportPathChipLabel("ab\ncd")).toBe("ab\ncd");
  });
  it("preserves interior whitespace in short path chip labels", () => {
    expect(formatAttackPathReportPathChipLabel("a b")).toBe("a b");
  });

  it("returns null overflow line for interior-newline-only path ids", () => {
    expect(attackPathReportPathChipOverflowLine(["\n"])).toBeNull();
  });  it("returns null overflow line when every path id is short", () => {
    expect(attackPathReportPathChipOverflowLine(["path-a", "path-b"])).toBeNull();
  });

  it("ellipsizes a 29-character path id while keeping a 28-character id verbatim", () => {
    const atBoundary = "a".repeat(28);
    const overBoundary = "a".repeat(29);

    expect(formatAttackPathReportPathChipLabel(atBoundary)).toBe(atBoundary);
    expect(formatAttackPathReportPathChipLabel(overBoundary)).toContain("…");
    expect(formatAttackPathReportPathChipLabel(overBoundary).length).toBeLessThan(overBoundary.length);
  });


  it("shows overflow honesty when a long path id contains an interior horizontal tab", () => {
    const longWithTab = `${"a".repeat(40)}\t${"b".repeat(8)}`;

    expect(attackPathReportPathChipOverflowLine([longWithTab])).toContain("Long path ids");
  });
  it("shows overflow honesty copy only when a path id exceeds 48 characters", () => {
    const atThreshold = "a".repeat(48);
    const overThreshold = "a".repeat(49);

    expect(attackPathReportPathChipOverflowLine([atThreshold])).toBeNull();
    expect(attackPathReportPathChipOverflowLine([overThreshold])).toContain("Long path ids");
  });

  it("shows overflow honesty after trimming padded long path ids", () => {
    const paddedLong = `${" ".repeat(4)}${"a".repeat(49)}${" ".repeat(3)}`;

    expect(attackPathReportPathChipOverflowLine([paddedLong])).toContain("Long path ids");
  });

  it("ellipsizes padded long path ids after trim", () => {
    const padded = `  ${"a".repeat(29)}  `;

    expect(formatAttackPathReportPathChipLabel(padded)).toContain("…");
    expect(formatAttackPathReportPathChipLabel(padded).length).toBeLessThan(padded.length);
  });

  it("shows overflow honesty when any path id is long after trim among short ids", () => {
    const shortId = "path-a";
  const paddedLong = `  ${"a".repeat(49)}  `;

    expect(attackPathReportPathChipOverflowLine([shortId, paddedLong])).toContain("Long path ids");
  });

  it("returns empty string for a whitespace-only path id after trim", () => {
    expect(formatAttackPathReportPathChipLabel("   ")).toBe("");
  });

  it("returns null overflow line for whitespace-only path ids in the list", () => {
    expect(attackPathReportPathChipOverflowLine(["   ", "\t"])).toBeNull();
  });


  it("returns null overflow line for a single short path id in the list", () => {
    expect(attackPathReportPathChipOverflowLine(["short-path"])).toBeNull();
  });  it("returns null overflow line for an empty path id list", () => {
    expect(attackPathReportPathChipOverflowLine([])).toBeNull();
  });
});
