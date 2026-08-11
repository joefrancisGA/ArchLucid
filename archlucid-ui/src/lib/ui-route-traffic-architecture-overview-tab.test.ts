import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_NOTE,
  ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_PATH,
  ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_ROW_ID,
  ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-architecture-overview-tab";

describe("ui-route-traffic-architecture-overview-tab (REO)", () => {
  it("tracks create-home-only Overview archTab with honest workbook notes (TB-1861)", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_PATH);
    expect(row?.section).toBe(ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_NOTE);
    expect(row?.notes).toContain("Create-home-only");
    expect(row?.notes).toContain("ignored on committed ReviewDetailWorkspace");
    expect(row?.notes).toContain("reviewTab=overview");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
