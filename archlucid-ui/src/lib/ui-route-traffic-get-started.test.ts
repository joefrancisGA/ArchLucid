import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  GET_STARTED_TRAFFIC_NOTE,
  GET_STARTED_TRAFFIC_PATH,
  GET_STARTED_TRAFFIC_ROW_ID,
  GET_STARTED_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-get-started";

describe("ui-route-traffic-get-started (GXX)", () => {
  it("tracks Get started with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === GET_STARTED_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(GET_STARTED_TRAFFIC_PATH);
    expect(row?.section).toBe(GET_STARTED_TRAFFIC_SECTION);
    expect(row?.notes).toBe(GET_STARTED_TRAFFIC_NOTE);
    expect(row?.notes).toContain("GetStartedPageClient");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
