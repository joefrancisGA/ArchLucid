import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  REVIEW_WORKSPACE_TRAFFIC_NOTE,
  REVIEW_WORKSPACE_TRAFFIC_PATH,
  REVIEW_WORKSPACE_TRAFFIC_ROW_ID,
  REVIEW_WORKSPACE_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-review-workspace";

describe("ui-route-traffic-review-workspace (RRE)", () => {
  it("tracks review workspace with former SRN hit share and no SRN row", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const rre = rows.find((candidate) => candidate.id === REVIEW_WORKSPACE_TRAFFIC_ROW_ID);
    const srn = rows.find((candidate) => candidate.id === "SRN");

    expect(srn).toBeUndefined();
    expect(rre).toBeDefined();
    expect(rre?.path).toBe(REVIEW_WORKSPACE_TRAFFIC_PATH);
    expect(rre?.hitPct).toBe("10.04%");
    expect(rre?.section).toBe(REVIEW_WORKSPACE_TRAFFIC_SECTION);
    expect(rre?.notes).toBe(REVIEW_WORKSPACE_TRAFFIC_NOTE);
    expect(rre?.notes).toContain("Absorbs former SRN");
    expect(rre?.notes).toContain("RunDetailPageView");
    expect(rre?.notes).toContain("Score 72");
  });
});
