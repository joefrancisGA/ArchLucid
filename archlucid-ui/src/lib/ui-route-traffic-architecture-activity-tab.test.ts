import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ARCHITECTURE_ACTIVITY_TAB_TRAFFIC_NOTE,
  ARCHITECTURE_ACTIVITY_TAB_TRAFFIC_PATH,
  ARCHITECTURE_ACTIVITY_TAB_TRAFFIC_ROW_ID,
  ARCHITECTURE_ACTIVITY_TAB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-architecture-activity-tab";

describe("ui-route-traffic-architecture-activity-tab (REA)", () => {
  it("tracks create-home-only Activity archTab with honest workbook notes (TB-1831)", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ARCHITECTURE_ACTIVITY_TAB_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ARCHITECTURE_ACTIVITY_TAB_TRAFFIC_PATH);
    expect(row?.section).toBe(ARCHITECTURE_ACTIVITY_TAB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ARCHITECTURE_ACTIVITY_TAB_TRAFFIC_NOTE);
    expect(row?.notes).toContain("Create-home-only");
    expect(row?.notes).toContain("reviewTab=activity");
    expect(row?.notes).toContain("ignored on committed ReviewDetailWorkspace");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
