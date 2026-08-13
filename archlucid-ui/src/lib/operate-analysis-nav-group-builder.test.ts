import { describe, expect, it } from "vitest";

import { OperateAnalysisNavGroupBuilder } from "@/lib/operate-analysis-nav-group-builder";
import { OperateGovernanceNavGroupBuilder } from "@/lib/operate-governance-nav-group-builder";
import { GOVERNANCE_EXCEPTIONS_PATH } from "@/lib/governance/governance-route-paths";

describe("OperateAnalysisNavGroupBuilder", () => {
  it("uses Insights group label and caption (TB-525)", () => {
    const group = new OperateAnalysisNavGroupBuilder().build();

    expect(group.label).toBe("Insights");
    expect(group.caption).toBe("Explore evidence, findings, decisions, and sponsor value reports across reviews.");
  });

  it("lists Evidence graph first in Insights nav (TB-519)", () => {
    const group = new OperateAnalysisNavGroupBuilder().build();
    const graphLink = group.links[0];

    expect(graphLink?.href).toBe("/insights/evidence-graph");
    expect(graphLink?.label).toBe("Evidence graph");
    expect(graphLink?.keyShortcut).toBe("alt+y");
  });

  it("lists sponsor reports after Pattern library in Insights nav", () => {
    const group = new OperateAnalysisNavGroupBuilder().build();

    expect(group.links.map((link) => link.href)).toEqual([
      "/insights/evidence-graph",
      "/insights/ask-review-questions",
      "/insights/search-review-evidence",
      "/insights/compare-two-reviews",
      "/insights/impact-preview",
      "/insights/improvement-planning",
      "/insights/architecture-scorecard",
      "/insights/patterns",
      "/insights/executive-summary",
      "/insights/roi-summary",
    ]);
    expect(group.links.at(-3)?.label).toBe("Pattern library");
    expect(group.links.at(-3)?.navBadge).toBeUndefined();
    expect(group.links.at(-2)?.label).toBe("Sponsor report");
    expect(group.links.at(-1)?.label).toBe("ROI summary");
  });

  it("keeps the merged sponsor report read-gated so viewers reach it and exports stay Execute-gated", () => {
    const group = new OperateAnalysisNavGroupBuilder().build();
    const sponsorReport = group.links.find((link) => link.href === "/insights/executive-summary");

    expect(sponsorReport?.requiredAuthority).toBe("ReadAuthority");
    expect(group.links.some((link) => link.href === "/insights/pilot-outcomes")).toBe(false);
  });

  it("does not list Architecture intelligence in Insights nav", () => {
    const group = new OperateAnalysisNavGroupBuilder().build();

    expect(group.links.some((link) => link.href === "/architecture/architecture-intelligence")).toBe(false);
  });

  it("lists Improvement planning after Impact preview in Insights nav", () => {
    const group = new OperateAnalysisNavGroupBuilder().build();
    const planningIndex = group.links.findIndex((link) => link.href === "/insights/improvement-planning");

    expect(planningIndex).toBeGreaterThan(0);
    expect(group.links[planningIndex - 1]?.href).toBe("/insights/impact-preview");
    expect(group.links[planningIndex]?.label).toBe("Improvement planning");
  });
});

describe("OperateGovernanceNavGroupBuilder", () => {
  it("labels advisory nav as Advisory scans (TB-529)", () => {
    const group = new OperateGovernanceNavGroupBuilder().build();
    const advisoryLink = group.links.find((link) => link.href === "/governance/advisory-scans");

    expect(advisoryLink?.label).toBe("Advisory scans");
  });

  it("uses canonical exceptions path for waivers register", () => {
    const group = new OperateGovernanceNavGroupBuilder().build();
    const exceptionsLink = group.links.find((link) => link.href === GOVERNANCE_EXCEPTIONS_PATH);

    expect(exceptionsLink?.label).toBe("Exceptions");
  });
});
