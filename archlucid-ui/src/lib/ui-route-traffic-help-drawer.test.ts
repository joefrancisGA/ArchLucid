import { describe, expect, it } from "vitest";

import {
  findUiRouteTrafficTemplateRow,
  loadUiRouteTrafficMasterTableRows,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  HELP_DRAWER_TRAFFIC_NOTE,
  HELP_DRAWER_TRAFFIC_PATH,
  HELP_DRAWER_TRAFFIC_ROW_ID,
  HELP_DRAWER_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-help-drawer";

describe("ui-route-traffic-help-drawer (HCD)", () => {
  const row = findUiRouteTrafficTemplateRow(
    loadUiRouteTrafficMasterTableRows(),
    HELP_DRAWER_TRAFFIC_ROW_ID,
  );

  it("tracks the contextual help drawer shell overlay", () => {
    expect(row).toBeDefined();
    expect(row?.path).toBe(HELP_DRAWER_TRAFFIC_PATH);
    expect(row?.section).toBe(HELP_DRAWER_TRAFFIC_SECTION);
  });

  it("keeps the module notes verbatim with the owner workbook", () => {
    expect(row?.notes).toBe(HELP_DRAWER_TRAFFIC_NOTE);
  });

  it("carries every master-table column, so the row is not silently short one cell", () => {
    expect(row?.hitPct).not.toBe("");
    expect(row?.done).not.toBe("");
  });
});
