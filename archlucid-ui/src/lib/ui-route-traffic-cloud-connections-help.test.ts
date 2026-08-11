import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  CLOUD_CONNECTIONS_HELP_TRAFFIC_NOTE,
  CLOUD_CONNECTIONS_HELP_TRAFFIC_PATH,
  CLOUD_CONNECTIONS_HELP_TRAFFIC_ROW_ID,
  CLOUD_CONNECTIONS_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-cloud-connections-help";

describe("ui-route-traffic-cloud-connections-help (HCE)", () => {
  it("tracks Cloud connections help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === CLOUD_CONNECTIONS_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(CLOUD_CONNECTIONS_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(CLOUD_CONNECTIONS_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(CLOUD_CONNECTIONS_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpCloudConnectionsGuideView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
