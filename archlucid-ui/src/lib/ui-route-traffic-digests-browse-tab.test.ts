import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DIGESTS_BROWSE_TAB_TRAFFIC_NOTE,
  DIGESTS_BROWSE_TAB_TRAFFIC_PATH,
  DIGESTS_BROWSE_TAB_TRAFFIC_ROW_ID,
  DIGESTS_BROWSE_TAB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-digests-browse-tab";

describe("ui-route-traffic-digests-browse-tab (ARB)", () => {
  it("tracks Digests Browse tab with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === DIGESTS_BROWSE_TAB_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(DIGESTS_BROWSE_TAB_TRAFFIC_PATH);
    expect(row?.section).toBe(DIGESTS_BROWSE_TAB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DIGESTS_BROWSE_TAB_TRAFFIC_NOTE);
    expect(row?.notes).toContain("DigestsBrowseSetupChecklist");

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
