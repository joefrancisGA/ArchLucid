import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ADVISORY_SCANS_TRAFFIC_NOTE,
  ADVISORY_SCANS_TRAFFIC_PATH,
  ADVISORY_SCANS_TRAFFIC_ROW_ID,
  ADVISORY_SCANS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-advisory-scans";

describe("ui-route-traffic-advisory-scans (ADV)", () => {
  it("tracks Advisory scans with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ADVISORY_SCANS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ADVISORY_SCANS_TRAFFIC_PATH);
    expect(row?.section).toBe(ADVISORY_SCANS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ADVISORY_SCANS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("AdvisoryHubClient");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
