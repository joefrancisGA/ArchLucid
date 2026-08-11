import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  FAQ_TRAFFIC_NOTE,
  FAQ_TRAFFIC_PATH,
  FAQ_TRAFFIC_ROW_ID,
  FAQ_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-faq";

describe("ui-route-traffic-faq (FXX)", () => {
  it("tracks Product FAQ with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === FAQ_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(FAQ_TRAFFIC_PATH);
    expect(row?.section).toBe(FAQ_TRAFFIC_SECTION);
    expect(row?.notes).toBe(FAQ_TRAFFIC_NOTE);
    expect(row?.notes).toContain("MarketingFaqPageClient");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
