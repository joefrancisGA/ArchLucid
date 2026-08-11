import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  GCP_CLOUD_CONNECTION_TRAFFIC_NOTE,
  GCP_CLOUD_CONNECTION_TRAFFIC_PATH,
  GCP_CLOUD_CONNECTION_TRAFFIC_ROW_ID,
  GCP_CLOUD_CONNECTION_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-gcp-cloud-connection";

describe("ui-route-traffic-gcp-cloud-connection (IGC)", () => {
  it("tracks GCP cloud connection with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === GCP_CLOUD_CONNECTION_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(GCP_CLOUD_CONNECTION_TRAFFIC_PATH);
    expect(row?.section).toBe(GCP_CLOUD_CONNECTION_TRAFFIC_SECTION);
    expect(row?.notes).toBe(GCP_CLOUD_CONNECTION_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
