import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DEPLOYMENT_STATUS_TRAFFIC_NOTE,
  DEPLOYMENT_STATUS_TRAFFIC_PATH,
  DEPLOYMENT_STATUS_TRAFFIC_ROW_ID,
  DEPLOYMENT_STATUS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-deployment-status";

describe("ui-route-traffic-deployment-status (ADE)", () => {
  it("tracks Deployment status with Admin Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, DEPLOYMENT_STATUS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(DEPLOYMENT_STATUS_TRAFFIC_PATH);
    expect(row?.section).toBe(DEPLOYMENT_STATUS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DEPLOYMENT_STATUS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("AdminDeploymentStatusPageView");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
