import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SESSION_EXPIRED_TRAFFIC_NOTE,
  SESSION_EXPIRED_TRAFFIC_PATH,
  SESSION_EXPIRED_TRAFFIC_ROW_ID,
  SESSION_EXPIRED_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-session-expired";

describe("ui-route-traffic-session-expired (ASU)", () => {
  it("tracks Session expired with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SESSION_EXPIRED_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SESSION_EXPIRED_TRAFFIC_PATH);
    expect(row?.section).toBe(SESSION_EXPIRED_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SESSION_EXPIRED_TRAFFIC_NOTE);
    expect(row?.notes).toContain("SessionExpiredClient");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
