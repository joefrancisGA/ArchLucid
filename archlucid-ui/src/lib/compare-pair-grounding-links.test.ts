import { describe, expect, it } from "vitest";

import {
  comparePairGroundingForRuns,
  comparePairGroundingHasLinks,
} from "@/lib/compare-pair-grounding-links";
import {
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
} from "@/lib/showcase-static-demo";

describe("comparePairGroundingForRuns", () => {
  it("builds baseline and updated cite sides for a demo pair", () => {
    const grounding = comparePairGroundingForRuns(
      SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
      SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
    );

    expect(comparePairGroundingHasLinks(grounding)).toBe(true);
    expect(grounding.baseline?.sideLabel).toBe("Baseline");
    expect(grounding.updated?.sideLabel).toBe("Updated");
    expect(grounding.baseline?.links.some((link) => link.href.includes("evidence-graph"))).toBe(true);
    expect(grounding.updated?.links.some((link) => link.href.includes("governance/audit"))).toBe(true);
  });

  it("returns null sides when run ids are empty", () => {
    const grounding = comparePairGroundingForRuns("", "  ");

    expect(comparePairGroundingHasLinks(grounding)).toBe(false);
    expect(grounding.baseline).toBeNull();
    expect(grounding.updated).toBeNull();
  });
});
