import { describe, expect, it } from "vitest";

import { OperateAnalysisNavGroupBuilder } from "@/lib/operate-analysis-nav-group-builder";
import { PilotNavGroupBuilder } from "@/lib/pilot-nav-group-builder";

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

  it("keeps Evidence graph out of Review work nav (TB-519)", () => {
    const pilot = new PilotNavGroupBuilder().build();

    expect(pilot.links.some((link) => link.href === "/graph")).toBe(false);
  });
});
