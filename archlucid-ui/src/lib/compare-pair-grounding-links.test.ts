import { describe, expect, it } from "vitest";

import {
  comparePairGroundingForRuns,
  comparePairGroundingHasLinks,
  resolveComparePairPrimaryFindingIds,
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

  it("grounds Open review when primary finding ids are supplied", () => {
    const grounding = comparePairGroundingForRuns("run-a", "run-b", {
      baselinePrimaryFindingId: "finding-base",
      updatedPrimaryFindingId: "finding-updated",
    });

    expect(grounding.baseline?.links[0]?.href).toContain("findingId=finding-base");
    expect(grounding.updated?.links[0]?.href).toContain("findingId=finding-updated");
  });

  it("resolveComparePairPrimaryFindingIds reads first prior and current ids", () => {
    const ids = resolveComparePairPrimaryFindingIds([
      {
        state: "NewlyIdentified",
        resolutionBasis: null,
        priorFindingId: null,
        currentFindingId: "finding-new",
        correlationMethod: "dedupe",
        severity: "High",
        category: "Storage",
        message: "msg",
        sourceAgent: "agent",
        latestDisposition: null,
      },
      {
        state: "PreviouslyIdentifiedStillPresent",
        resolutionBasis: null,
        priorFindingId: "finding-prior",
        currentFindingId: "finding-current",
        correlationMethod: "dedupe",
        severity: "High",
        category: "Storage",
        message: "msg",
        sourceAgent: "agent",
        latestDisposition: null,
      },
    ]);

    expect(ids).toEqual({
      baselinePrimaryFindingId: "finding-prior",
      updatedPrimaryFindingId: "finding-new",
    });
  });
});
