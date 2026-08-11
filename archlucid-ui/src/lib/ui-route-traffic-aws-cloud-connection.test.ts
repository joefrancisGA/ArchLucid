import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  AWS_CLOUD_CONNECTION_TRAFFIC_NOTE,
  AWS_CLOUD_CONNECTION_TRAFFIC_PATH,
  AWS_CLOUD_CONNECTION_TRAFFIC_ROW_ID,
  AWS_CLOUD_CONNECTION_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-aws-cloud-connection";

describe("ui-route-traffic-aws-cloud-connection (INC)", () => {
  it("tracks AWS cloud connection with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === AWS_CLOUD_CONNECTION_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(AWS_CLOUD_CONNECTION_TRAFFIC_PATH);
    expect(row?.section).toBe(AWS_CLOUD_CONNECTION_TRAFFIC_SECTION);
    expect(row?.notes).toBe(AWS_CLOUD_CONNECTION_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
