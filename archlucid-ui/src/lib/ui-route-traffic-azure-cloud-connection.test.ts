import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  AZURE_CLOUD_CONNECTION_TRAFFIC_NOTE,
  AZURE_CLOUD_CONNECTION_TRAFFIC_PATH,
  AZURE_CLOUD_CONNECTION_TRAFFIC_ROW_ID,
  AZURE_CLOUD_CONNECTION_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-azure-cloud-connection";

describe("ui-route-traffic-azure-cloud-connection (IAZ)", () => {
  it("tracks Azure cloud connection with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === AZURE_CLOUD_CONNECTION_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(AZURE_CLOUD_CONNECTION_TRAFFIC_PATH);
    expect(row?.section).toBe(AZURE_CLOUD_CONNECTION_TRAFFIC_SECTION);
    expect(row?.notes).toBe(AZURE_CLOUD_CONNECTION_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
