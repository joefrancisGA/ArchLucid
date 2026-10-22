import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  GOVERNANCE_DASHBOARD_TRAFFIC_PATH,
  GOVERNANCE_DASHBOARD_RETIRED_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-governance-dashboard";
import { ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_ROW_ID } from "@/lib/ui-route-traffic-architecture-sponsor-dashboard";
import { WORKSPACE_HEALTH_PATH } from "@/lib/workspace-health-route";

describe("ui-route-traffic-governance-dashboard", () => {
  it("tracks the legacy approval dashboard bookmark without reviving the retired GDX row id", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const gdxRow = rows.find((row) => row.id === GOVERNANCE_DASHBOARD_RETIRED_TRAFFIC_ROW_ID);
    const areRow = rows.find((row) => row.id === ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_ROW_ID);
    const retiredPathRow = rows.find((row) => row.path === GOVERNANCE_DASHBOARD_TRAFFIC_PATH);
    const workspaceHealthRow = rows.find((row) => row.path === WORKSPACE_HEALTH_PATH);

    expect(gdxRow).toBeUndefined();
    expect(retiredPathRow).toBeDefined();
    expect(workspaceHealthRow).toBeDefined();
    expect(areRow).toBeDefined();
  });
});
