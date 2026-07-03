import { describe, expect, it } from "vitest";

import { OperateAnalysisNavGroupBuilder } from "@/lib/operate-analysis-nav-group-builder";

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

  it("labels advisory nav as Advisory scans (TB-529)", () => {
    const group = new OperateAnalysisNavGroupBuilder().build();
    const advisoryLink = group.links.find((link) => link.href === "/advisory");

    expect(advisoryLink?.label).toBe("Advisory scans");
  });
});
