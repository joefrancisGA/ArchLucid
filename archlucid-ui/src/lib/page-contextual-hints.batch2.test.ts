import { describe, expect, it } from "vitest";

import { pageContextualHintForPathname } from "@/lib/page-contextual-hints";

describe("pageContextualHintForPathname batch-2 surfaces", () => {
  it("returns hints for compare, graph, policy packs, and findings", () => {
    expect(pageContextualHintForPathname("/insights/compare-two-reviews")?.id).toBe("compare-reviews");
    expect(pageContextualHintForPathname("/insights/evidence-graph")?.id).toBe("evidence-graph");
    expect(pageContextualHintForPathname("/governance/policy-packs")?.id).toBe("policy-packs");
    expect(pageContextualHintForPathname("/governance/findings")?.id).toBe("governance-findings");
  });

  it("returns a hint for the new review wizard", () => {
    expect(pageContextualHintForPathname("/architecture/reviews/new")?.id).toBe("reviews-new");
  });
});
