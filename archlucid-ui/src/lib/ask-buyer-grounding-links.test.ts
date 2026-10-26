import { describe, expect, it } from "vitest";

import {
  buildAskAnswerCitationSourceLinks,
  buyerAskGroundingLinksForRun,
} from "@/lib/ask-buyer-grounding-links";
import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("buyerAskGroundingLinksForRun", () => {
  it("returns deterministic workspace anchors for the canonical showcase run id", () => {
    const links = buyerAskGroundingLinksForRun(SHOWCASE_STATIC_DEMO_RUN_ID);

    expect(links).not.toBeNull();
    expect(links!.length).toBe(7);
    expect(links![0]?.label).toBe("Sponsor report");
    expect(links![0]?.href).toContain("/architecture/reviews/");
    expect(links![1]?.href).toContain("/governance/sealed-records/");
    expect(links!.some((l) => l.href.includes("/findings/sensitive-data-minimization-risk"))).toBe(true);
    expect(links!.some((l) => l.href.includes("/insights/evidence-graph?"))).toBe(true);
    expect(links!.some((l) => l.href.includes("/governance/audit?"))).toBe(true);
    expect(links!.some((l) => l.href.includes("/insights/compare-two-reviews?"))).toBe(true);
    expect(links!.some((l) => l.href.includes("/governance/policy-packs/"))).toBe(true);
  });

  it("returns baseline review / evidence / audit cites for non-showcase reviews", () => {
    const links = buyerAskGroundingLinksForRun("some-other-run");

    expect(links).not.toBeNull();
    expect(links!.length).toBe(3);
    expect(links![0]?.label).toBe("Open review");
    expect(links!.some((l) => l.href.includes("/insights/evidence-graph?"))).toBe(true);
    expect(links!.some((l) => l.href.includes("/governance/audit?"))).toBe(true);
  });

  it("returns null when the run id is empty", () => {
    expect(buyerAskGroundingLinksForRun("")).toBeNull();
    expect(buyerAskGroundingLinksForRun("   ")).toBeNull();
  });

  it("buildAskAnswerCitationSourceLinks does not link decisions to the register", () => {
    const links = buildAskAnswerCitationSourceLinks("run-a", {
      referencedFindings: [],
      referencedDecisions: ["decision-9"],
      referencedArtifacts: [],
    });

    expect(links).toHaveLength(1);
    expect(links[0]?.label).toBe("Decision link was not stored for decision-9.");
    expect(links[0]?.href).toBeNull();
    expect(links.some((link) => link.href === GOVERNANCE_DECISION_REGISTER_PATH)).toBe(false);
  });

  it("buildAskAnswerCitationSourceLinks keeps Open review for review id artifacts only", () => {
    const links = buildAskAnswerCitationSourceLinks("run-a", {
      referencedFindings: [],
      referencedDecisions: [],
      referencedArtifacts: ["run-a", "artifact-other"],
    });

    expect(links).toEqual([
      { label: "Open review", href: "/architecture/reviews/run-a" },
      {
        label: "Evidence graph node for artifact artifact-other was not stored.",
        href: null,
      },
    ]);
  });

  it("normalizes known demo aliases to the showcase spine", () => {
    const links = buyerAskGroundingLinksForRun("claims-intake-modernization-run");

    expect(links).not.toBeNull();
    expect(links!.length).toBeGreaterThan(0);
  });
});
