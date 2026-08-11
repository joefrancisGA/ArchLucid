import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  RECOMMENDATION_LEARNING_TRAFFIC_NOTE,
  RECOMMENDATION_LEARNING_TRAFFIC_PATH,
  RECOMMENDATION_LEARNING_TRAFFIC_ROW_ID,
  RECOMMENDATION_LEARNING_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-recommendation-learning";

describe("ui-route-traffic-recommendation-learning (INE)", () => {
  it("tracks Recommendation learning with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === RECOMMENDATION_LEARNING_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(RECOMMENDATION_LEARNING_TRAFFIC_PATH);
    expect(row?.section).toBe(RECOMMENDATION_LEARNING_TRAFFIC_SECTION);
    expect(row?.section).not.toBe("Marketing");
    expect(row?.notes).toBe(RECOMMENDATION_LEARNING_TRAFFIC_NOTE);
    expect(row?.notes).toContain("RecommendationLearningOpsPageClient");
    expect(row?.notes).toContain("Internal Ops");
    expect(row?.notes).toContain("not Marketing");
    expect(row?.notes).toContain("Sources");

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
