import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  GOVERNANCE_DASHBOARD_TRAFFIC_PATH,
  GOVERNANCE_DASHBOARD_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-governance-dashboard";
import { ARCHITECTURE_EXECUTIVE_DASHBOARD_TRAFFIC_ROW_ID } from "@/lib/ui-route-traffic-architecture-executive-dashboard";

describe("ui-route-traffic-governance-dashboard (GDX removed)", () => {
  it("does not track retired GDX shim; workspace health stays on ARE", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const gdxRow = rows.find((row) => row.id === GOVERNANCE_DASHBOARD_TRAFFIC_ROW_ID);
    const areRow = rows.find((row) => row.id === ARCHITECTURE_EXECUTIVE_DASHBOARD_TRAFFIC_ROW_ID);
    const retiredPathRow = rows.find((row) => row.path === GOVERNANCE_DASHBOARD_TRAFFIC_PATH);

    expect(gdxRow).toBeUndefined();
    expect(retiredPathRow).toBeUndefined();
    expect(areRow).toBeDefined();
  });
});
