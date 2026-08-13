import { describe, expect, it } from "vitest";

import { buyerAskGroundingLinksForRun } from "@/lib/ask-buyer-grounding-links";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("buyerAskGroundingLinksForRun", () => {
  it("returns deterministic workspace anchors for the canonical showcase run id", () => {
    const links = buyerAskGroundingLinksForRun(SHOWCASE_STATIC_DEMO_RUN_ID);

    expect(links).not.toBeNull();
    expect(links!.length).toBe(7);
    expect(links![0]?.label).toBe("Sponsor report");
    expect(links![0]?.href).toContain("/architecture/reviews/");
    expect(links![1]?.href).toContain("/governance/signed-records/");
    expect(links!.some((l) => l.href.includes("/findings/phi-minimization-risk"))).toBe(true);
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

  it("normalizes known demo aliases to the showcase spine", () => {
    const links = buyerAskGroundingLinksForRun("claims-intake-modernization-run");

    expect(links).not.toBeNull();
    expect(links!.length).toBeGreaterThan(0);
  });
});
