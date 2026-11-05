import { describe, expect, it } from "vitest";

import {
  comparePairGroundingForRuns,
  comparePairGroundingHasLinks,
  resolveComparePairPrimaryFindingIds,
  resolveCompareUpdatedReviewOpenHref,
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

  it("nests Open review on both sides when architecture id is supplied", () => {
    const grounding = comparePairGroundingForRuns("run-a", "run-b", {
      architectureId: "architecture-identity-001",
    });

    expect(grounding.baseline?.links[0]?.href).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-a",
    );
    expect(grounding.updated?.links[0]?.href).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-b",
    );
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

describe("resolveCompareUpdatedReviewOpenHref", () => {
  it("matches cite-strip Open review when lifecycle has an updated finding", () => {
    const lifecycleRecords = [
      {
        state: "PreviouslyIdentifiedStillPresent" as const,
        resolutionBasis: null,
        priorFindingId: "finding-prior",
        currentFindingId: "finding-updated",
        correlationMethod: "dedupe" as const,
        severity: "High" as const,
        category: "Storage",
        message: "msg",
        sourceAgent: "agent",
        latestDisposition: null,
      },
    ];
    const grounding = comparePairGroundingForRuns("run-a", "run-b", resolveComparePairPrimaryFindingIds(lifecycleRecords));
    const bannerHref = resolveCompareUpdatedReviewOpenHref("run-b", "architecture-identity-001", lifecycleRecords);

    expect(bannerHref).toBe(grounding.updated?.links[0]?.href);
    expect(bannerHref).toContain("findingId=finding-updated");
  });

  it("falls back to working nested open when no updated finding is correlated", () => {
    expect(resolveCompareUpdatedReviewOpenHref("run-42", "architecture-identity-001", [])).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-42",
    );
  });
});
