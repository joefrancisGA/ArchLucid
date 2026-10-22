import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SPONSOR_SCORECARD_TRAFFIC_PATH,
  SPONSOR_SCORECARD_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-sponsor-scorecard";
import { ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_ROW_ID } from "@/lib/ui-route-traffic-architecture-sponsor-dashboard";

describe("ui-route-traffic-sponsor-scorecard (ESX removed)", () => {
  it("does not track retired ESX shim; sponsor scorecard absorbed by ARE", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const esxRow = rows.find((row) => row.id === SPONSOR_SCORECARD_TRAFFIC_ROW_ID);
    const areRow = rows.find((row) => row.id === ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_ROW_ID);
    const retiredPathRow = rows.find((row) => row.path === SPONSOR_SCORECARD_TRAFFIC_PATH);

    expect(esxRow).toBeUndefined();
    expect(retiredPathRow).toBeUndefined();
    expect(areRow).toBeDefined();
  });
});
