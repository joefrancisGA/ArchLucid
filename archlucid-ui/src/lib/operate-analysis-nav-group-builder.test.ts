import { describe, expect, it } from "vitest";

import { OperateAnalysisNavGroupBuilder } from "@/lib/operate-analysis-nav-group-builder";
import { OperateGovernanceNavGroupBuilder } from "@/lib/operate-governance-nav-group-builder";

describe("OperateAnalysisNavGroupBuilder", () => {
  it("uses Insights group label and caption (TB-525)", () => {
    const group = new OperateAnalysisNavGroupBuilder().build();

    expect(group.label).toBe("Insights");
    expect(group.caption).toBe("Explore evidence, findings, and decisions across reviews.");
  });

  it("lists Evidence graph first in Insights nav (TB-519)", () => {
    const group = new OperateAnalysisNavGroupBuilder().build();
    const graphLink = group.links[0];

    expect(graphLink?.href).toBe("/graph");
    expect(graphLink?.label).toBe("Evidence graph");
    expect(graphLink?.keyShortcut).toBe("alt+y");
  });

  it("lists Pattern library last in Insights nav", () => {
    const group = new OperateAnalysisNavGroupBuilder().build();

    expect(group.links.map((link) => link.href)).toEqual([
      "/graph",
      "/ask",
      "/search",
      "/compare",
      "/evolution-review",
      "/scorecard",
      "/patterns",
    ]);
    expect(group.links.at(-1)?.label).toBe("Pattern library");
    expect(group.links.at(-1)?.navBadge).toBe("Preview");
  });

  it("lists Architecture scorecard before Pattern library in Insights nav", () => {
    const group = new OperateAnalysisNavGroupBuilder().build();

    expect(group.links.at(-2)?.label).toBe("Architecture scorecard");
  });
});

describe("OperateGovernanceNavGroupBuilder", () => {
  it("labels advisory nav as Advisory scans (TB-529)", () => {
    const group = new OperateGovernanceNavGroupBuilder().build();
    const advisoryLink = group.links.find((link) => link.href === "/advisory");

    expect(advisoryLink?.label).toBe("Advisory scans");
  });
});
