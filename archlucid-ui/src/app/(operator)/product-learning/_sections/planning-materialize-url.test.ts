import { describe, expect, it } from "vitest";

import { buildProductLearningPlanningMaterializeUrl } from "./planning-materialize-url";

describe("buildProductLearningPlanningMaterializeUrl", () => {
  it("clamps maxPlansToMaterialize to 1–50", () => {
    expect(buildProductLearningPlanningMaterializeUrl(null, 0)).toContain("maxPlansToMaterialize=1");
    expect(buildProductLearningPlanningMaterializeUrl(null, 999)).toContain("maxPlansToMaterialize=50");
  });

  it("omits since when null or blank", () => {
    expect(buildProductLearningPlanningMaterializeUrl(null, 10)).not.toContain("since=");
    expect(buildProductLearningPlanningMaterializeUrl("   ", 10)).not.toContain("since=");
  });

  it("includes since when provided", () => {
    const url = buildProductLearningPlanningMaterializeUrl("2026-01-02T03:04:05.000Z", 12);
    expect(url).toContain("since=2026-01-02T03%3A04%3A05.000Z");
    expect(url).toContain("maxPlansToMaterialize=12");
  });
});
