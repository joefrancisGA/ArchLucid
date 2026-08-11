import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SEE_IT_TRAFFIC_NOTE,
  SEE_IT_TRAFFIC_PATH,
  SEE_IT_TRAFFIC_ROW_ID,
  SEE_IT_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-see-it";

describe("ui-route-traffic-see-it (SEE)", () => {
  it("tracks See it with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SEE_IT_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SEE_IT_TRAFFIC_PATH);
    expect(row?.section).toBe(SEE_IT_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SEE_IT_TRAFFIC_NOTE);
    expect(row?.notes).toContain("SeeItMarketingPage");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
