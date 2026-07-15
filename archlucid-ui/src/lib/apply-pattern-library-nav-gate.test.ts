import { describe, expect, it } from "vitest";

import { applyPatternLibraryHrefSetGate, applyPatternLibraryNavGate } from "@/lib/apply-pattern-library-nav-gate";
import type { NavGroupConfig } from "@/lib/nav-config.types";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";

const analysisGroup: NavGroupConfig = {
  id: "operate-analysis",
  label: "Insights",
  surface: "review-workflow",
  caption: "Explore evidence",
  links: [
    {
      href: "/graph",
      label: "Evidence graph",
      title: "Graph",
      tier: "essential",
      requiredAuthority: "ReadAuthority",
    },
    {
      href: "/patterns",
      label: "Pattern library",
      title: "Patterns",
      tier: "extended",
      requiredAuthority: "ReadAuthority",
    },
  ],
};

describe("applyPatternLibraryNavGate", () => {
  it("omits Pattern library when below threshold", () => {
    const rows: NavGroupWithVisibleLinks[] = [
      {
        group: analysisGroup,
        visibleLinks: analysisGroup.links,
      },
    ];

    const gated = applyPatternLibraryNavGate(rows, false);

    expect(gated[0]?.visibleLinks.map((link) => link.href)).toEqual(["/graph"]);
  });

  it("keeps Pattern library when threshold is met", () => {
    const rows: NavGroupWithVisibleLinks[] = [
      {
        group: analysisGroup,
        visibleLinks: analysisGroup.links,
      },
    ];

    const gated = applyPatternLibraryNavGate(rows, true);

    expect(gated[0]?.visibleLinks.map((link) => link.href)).toEqual(["/graph", "/patterns"]);
  });
});

describe("applyPatternLibraryHrefSetGate", () => {
  it("removes /patterns from the href set when hidden", () => {
    const gated = applyPatternLibraryHrefSetGate(new Set(["/graph", "/patterns"]), false);

    expect([...gated]).toEqual(["/graph"]);
  });
});
