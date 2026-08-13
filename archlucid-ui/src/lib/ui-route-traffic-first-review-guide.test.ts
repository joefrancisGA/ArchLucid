import { describe, expect, it } from "vitest";

import {
  extractMasterTableRows,
  findTrafficRowById,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  FIRST_REVIEW_GUIDE_TRAFFIC_NOTE,
  FIRST_REVIEW_GUIDE_TRAFFIC_PATH,
  FIRST_REVIEW_GUIDE_TRAFFIC_ROW_ID,
  FIRST_REVIEW_GUIDE_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-first-review-guide";

describe("ui-route-traffic-first-review-guide (ARF)", () => {
  it("tracks the canonical first-review guide with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, FIRST_REVIEW_GUIDE_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(FIRST_REVIEW_GUIDE_TRAFFIC_PATH);
    expect(row?.section).toBe(FIRST_REVIEW_GUIDE_TRAFFIC_SECTION);
    expect(row?.notes).toBe(FIRST_REVIEW_GUIDE_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("ONB");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
