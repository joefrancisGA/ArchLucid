import { describe, expect, it } from "vitest";

import { applyPatternLibraryHrefSetGate, applyPatternLibraryNavGate } from "@/lib/apply-pattern-library-nav-gate";
import { PATTERN_LIBRARY_NAV_UNAVAILABLE_TITLE } from "@/lib/pattern-library-copy";
import type { NavGroupConfig } from "@/lib/nav-config.types";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";

const analysisGroup: NavGroupConfig = {
  id: "operate-analysis",
  label: "Insights",
  surface: "review-workflow",
  caption: "Explore evidence",
  links: [
    {
      href: "/insights/evidence-graph",
      label: "Evidence graph",
      title: "Graph",
      tier: "essential",
      requiredAuthority: "ReadAuthority",
    },
    {
      href: "/insights/patterns",
      label: "Pattern library",
      title: "Patterns",
      tier: "extended",
      requiredAuthority: "ReadAuthority",
    },
  ],
};

describe("applyPatternLibraryNavGate", () => {
  it("marks Pattern library disabled when below threshold", () => {
    const rows: NavGroupWithVisibleLinks[] = [
      {
        group: analysisGroup,
        visibleLinks: analysisGroup.links,
      },
    ];

    const gated = applyPatternLibraryNavGate(rows, false);
    const patternLink = gated[0]?.visibleLinks.find((link) => link.href === "/insights/patterns");

    expect(patternLink?.navLinkDisabled).toBe(true);
    expect(patternLink?.navLinkDisabledTitle).toBe(PATTERN_LIBRARY_NAV_UNAVAILABLE_TITLE);
    expect(gated[0]?.visibleLinks.map((link) => link.href)).toEqual([
      "/insights/evidence-graph",
      "/insights/patterns",
    ]);
  });

  it("keeps Pattern library enabled when threshold is met", () => {
    const rows: NavGroupWithVisibleLinks[] = [
      {
        group: analysisGroup,
        visibleLinks: analysisGroup.links,
      },
    ];

    const gated = applyPatternLibraryNavGate(rows, true);
    const patternLink = gated[0]?.visibleLinks.find((link) => link.href === "/insights/patterns");

    expect(patternLink?.navLinkDisabled).toBeUndefined();
    expect(gated[0]?.visibleLinks.map((link) => link.href)).toEqual(["/insights/evidence-graph", "/insights/patterns"]);
  });
});

describe("applyPatternLibraryHrefSetGate", () => {
  it("keeps /insights/patterns in the href set when nav row is disabled", () => {
    const gated = applyPatternLibraryHrefSetGate(new Set(["/insights/evidence-graph", "/insights/patterns"]), false);

    expect([...gated]).toEqual(["/insights/evidence-graph", "/insights/patterns"]);
  });
});
