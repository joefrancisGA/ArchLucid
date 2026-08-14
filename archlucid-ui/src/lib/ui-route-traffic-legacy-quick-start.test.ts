import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";
import { findUiRouteTrafficRow } from "@/lib/ui-route-traffic/registry";
import {
  LEGACY_QUICK_START_TRAFFIC_NOTE,
  LEGACY_QUICK_START_TRAFFIC_PATH,
  LEGACY_QUICK_START_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-legacy-quick-start";

describe("ui-route-traffic legacy quick-start (TB-1816)", () => {
  it("does not track retired QUI; canonical /get-started stays on GXX", () => {
    const registryRow = findUiRouteTrafficRow(LEGACY_QUICK_START_TRAFFIC_ROW_ID);
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const quIRow = rows.find((row) => row.id === LEGACY_QUICK_START_TRAFFIC_ROW_ID);
    const quickStartPathRow = rows.find((row) => row.path === LEGACY_QUICK_START_TRAFFIC_PATH);
    const getStartedRow = rows.find((row) => row.id === "GXX");

    expect(registryRow).toBeUndefined();
    expect(quIRow).toBeUndefined();
    expect(quickStartPathRow).toBeUndefined();
    expect(getStartedRow?.path).toBe("/get-started");
    expect(getStartedRow?.notes.toLowerCase()).toContain("legacy /quick-start");
    expect(LEGACY_QUICK_START_TRAFFIC_NOTE.toLowerCase()).toContain("legacy");
    expect(LEGACY_QUICK_START_TRAFFIC_NOTE).toContain("/get-started");
    expect(LEGACY_QUICK_START_TRAFFIC_NOTE).not.toMatch(/live marketing/i);
  });
});
