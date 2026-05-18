import { describe, expect, it } from "vitest";

import { buyerAskGroundingLinksForRun } from "@/lib/ask-buyer-grounding-links";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("buyerAskGroundingLinksForRun", () => {
  it("returns deterministic workspace anchors for the canonical showcase run id", () => {
    const links = buyerAskGroundingLinksForRun(SHOWCASE_STATIC_DEMO_RUN_ID);

    expect(links).not.toBeNull();
    expect(links!.length).toBe(6);
    expect(links![0]?.label).toBe("Executive summary");
    expect(links![0]?.href).toContain("/executive/reviews/");
    expect(links![1]?.href).toContain("/manifest");
    expect(links!.some((l) => l.href.includes("/findings/phi-minimization-risk"))).toBe(true);
    expect(links!.some((l) => l.href.includes("/graph?"))).toBe(true);
    expect(links!.some((l) => l.href.includes("/audit?"))).toBe(true);
    expect(links!.some((l) => l.href.includes("/compare?"))).toBe(true);
  });

  it("returns null for unrelated reviews", () => {
    expect(buyerAskGroundingLinksForRun("some-other-run")).toBeNull();
  });

  it("normalizes known demo aliases to the showcase spine", () => {
    const links = buyerAskGroundingLinksForRun("claims-intake-modernization-run");

    expect(links).not.toBeNull();
    expect(links!.length).toBeGreaterThan(0);
  });
});
