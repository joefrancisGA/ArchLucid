import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DEMO_READINESS_TRAFFIC_NOTE,
  DEMO_READINESS_TRAFFIC_PATH,
  DEMO_READINESS_TRAFFIC_ROW_ID,
  DEMO_READINESS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-demo-readiness";

describe("ui-route-traffic-demo-readiness (ADD)", () => {
  it("tracks Demo readiness with Admin Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, DEMO_READINESS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(DEMO_READINESS_TRAFFIC_PATH);
    expect(row?.section).toBe(DEMO_READINESS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DEMO_READINESS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("DemoReadinessAdminPageClient");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
