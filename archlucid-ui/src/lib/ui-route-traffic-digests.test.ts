import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DIGESTS_TRAFFIC_NOTE,
  DIGESTS_TRAFFIC_PATH,
  DIGESTS_TRAFFIC_ROW_ID,
  DIGESTS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-digests";

describe("ui-route-traffic-digests (ARD)", () => {
  it("tracks Architecture digests with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === DIGESTS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(DIGESTS_TRAFFIC_PATH);
    expect(row?.section).toBe(DIGESTS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DIGESTS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("DigestsHubClient");
    expect(row?.notes).toContain("Score 71");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
