import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  FIRST_REVIEW_HELP_TRAFFIC_NOTE,
  FIRST_REVIEW_HELP_TRAFFIC_PATH,
  FIRST_REVIEW_HELP_TRAFFIC_ROW_ID,
  FIRST_REVIEW_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-first-review-help";

describe("ui-route-traffic-first-review-help (FI)", () => {
  it("tracks the canonical first-review help topic with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === FIRST_REVIEW_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(FIRST_REVIEW_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(FIRST_REVIEW_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(FIRST_REVIEW_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpFirstReviewEvidenceChecklistGuideView");
    expect(row?.notes).toContain("Not a redirect to buyer core-pilot");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
