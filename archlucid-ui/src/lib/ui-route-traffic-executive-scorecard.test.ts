import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  EXECUTIVE_SCORECARD_TRAFFIC_PATH,
  EXECUTIVE_SCORECARD_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-executive-scorecard";
import { ARCHITECTURE_EXECUTIVE_DASHBOARD_TRAFFIC_ROW_ID } from "@/lib/ui-route-traffic-architecture-executive-dashboard";

describe("ui-route-traffic-executive-scorecard (ESX removed)", () => {
  it("does not track retired ESX shim; sponsor scorecard absorbed by ARE", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const esxRow = rows.find((row) => row.id === EXECUTIVE_SCORECARD_TRAFFIC_ROW_ID);
    const areRow = rows.find((row) => row.id === ARCHITECTURE_EXECUTIVE_DASHBOARD_TRAFFIC_ROW_ID);
    const retiredPathRow = rows.find((row) => row.path === EXECUTIVE_SCORECARD_TRAFFIC_PATH);

    expect(esxRow).toBeUndefined();
    expect(retiredPathRow).toBeUndefined();
    expect(areRow).toBeDefined();
  });
});
