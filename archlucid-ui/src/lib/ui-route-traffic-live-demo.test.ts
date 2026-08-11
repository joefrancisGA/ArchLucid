import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  LIVE_DEMO_TRAFFIC_NOTE,
  LIVE_DEMO_TRAFFIC_PATH,
  LIVE_DEMO_TRAFFIC_ROW_ID,
  LIVE_DEMO_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-live-demo";

describe("ui-route-traffic-live-demo (LXX)", () => {
  it("tracks Live demo with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === LIVE_DEMO_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(LIVE_DEMO_TRAFFIC_PATH);
    expect(row?.section).toBe(LIVE_DEMO_TRAFFIC_SECTION);
    expect(row?.notes).toBe(LIVE_DEMO_TRAFFIC_NOTE);
    expect(row?.notes).toContain("LiveDemoMarketingPage");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
