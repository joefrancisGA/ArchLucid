import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SIGNED_RECORD_DETAIL_TRAFFIC_NOTE,
  SIGNED_RECORD_DETAIL_TRAFFIC_PATH,
  SIGNED_RECORD_DETAIL_TRAFFIC_ROW_ID,
  SIGNED_RECORD_DETAIL_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-signed-record-detail";

describe("ui-route-traffic-signed-record-detail (MMX)", () => {
  it("tracks signed-record detail with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SIGNED_RECORD_DETAIL_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SIGNED_RECORD_DETAIL_TRAFFIC_PATH);
    expect(row?.section).toBe(SIGNED_RECORD_DETAIL_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SIGNED_RECORD_DETAIL_TRAFFIC_NOTE);
    expect(row?.notes).toContain("ManifestDetailPageView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
