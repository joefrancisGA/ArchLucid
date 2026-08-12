import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  REPEAT_REVIEW_LOOP_HELP_TRAFFIC_NOTE,
  REPEAT_REVIEW_LOOP_HELP_TRAFFIC_PATH,
  REPEAT_REVIEW_LOOP_HELP_TRAFFIC_ROW_ID,
  REPEAT_REVIEW_LOOP_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-repeat-review-loop-help";

describe("ui-route-traffic-repeat-review-loop-help (HRX)", () => {
  it("tracks repeat-review-loop help with Help topic Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, REPEAT_REVIEW_LOOP_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(REPEAT_REVIEW_LOOP_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(REPEAT_REVIEW_LOOP_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(REPEAT_REVIEW_LOOP_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpRepeatReviewLoopGuideView");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
