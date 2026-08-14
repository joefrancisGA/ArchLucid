import { describe, expect, it } from "vitest";

import {
  extractMasterTableRows,
  findTrafficRowById,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";
import { REMOVED_REDIRECT_SHIM_TRAFFIC_ROW_IDS } from "@/lib/ui-route-traffic-retired-redirect-shims";

import {
  ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_NOTE,
  ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_PATH,
  ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_ROW_ID,
  ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-architecture-sponsor-dashboard";

describe("ui-route-traffic-architecture-sponsor-dashboard (ARE)", () => {
  it("tracks the canonical sponsor dashboard path with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_PATH);
    expect(row?.section).toBe(ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ARCHITECTURE_SPONSOR_DASHBOARD_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("ExecutiveRoiDashboardPageView");
    
    expect(row?.notes).toContain("DSH");
    expect(row?.notes).toContain("Score 72");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });

  it("does not track retired EDA workbook row independently (TB-1527)", () => {
    expect(REMOVED_REDIRECT_SHIM_TRAFFIC_ROW_IDS).toContain("EDA");

    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());

    expect(rows.find((row) => row.id === "EDA")).toBeUndefined();
    expect(rows.find((row) => row.path === "/sponsor/dashboard")).toBeUndefined();
  });
});
