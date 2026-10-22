import { describe, expect, it } from "vitest";

import {
  findUiRouteTrafficTemplateRow,
  loadUiRouteTrafficMasterTableRows,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  WHY_ARCHLUCID_TRAFFIC_NOTE,
  WHY_ARCHLUCID_TRAFFIC_PATH,
  WHY_ARCHLUCID_TRAFFIC_ROW_ID,
  WHY_ARCHLUCID_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-why-archlucid";

describe("ui-route-traffic-why-archlucid (WH)", () => {
  const row = findUiRouteTrafficTemplateRow(
    loadUiRouteTrafficMasterTableRows(),
    WHY_ARCHLUCID_TRAFFIC_ROW_ID,
  );

  it("tracks pilot proof telemetry with honest workbook notes", () => {
    expect(row).toBeDefined();
    expect(row?.path).toBe(WHY_ARCHLUCID_TRAFFIC_PATH);
    expect(row?.section).toBe(WHY_ARCHLUCID_TRAFFIC_SECTION);
    expect(row?.notes).toBe(WHY_ARCHLUCID_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/breadcrumb|claim orientation|skeleton/i);
  });

  it("carries every master-table column, so the row is not silently short one cell", () => {
    expect(row?.hitPct).not.toBe("");
    expect(row?.done).not.toBe("");
  });
});
