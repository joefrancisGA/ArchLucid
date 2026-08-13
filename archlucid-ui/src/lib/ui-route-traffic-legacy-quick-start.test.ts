import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";
import { findUiRouteTrafficRow } from "@/lib/ui-route-traffic/registry";
import {
  LEGACY_QUICK_START_TRAFFIC_NOTE,
  LEGACY_QUICK_START_TRAFFIC_PATH,
  LEGACY_QUICK_START_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-legacy-quick-start";

describe("ui-route-traffic legacy quick-start (TB-1816)", () => {
  it("tracks QUI as a redirect-only workbook row", () => {
    const registryRow = findUiRouteTrafficRow(LEGACY_QUICK_START_TRAFFIC_ROW_ID);
    const templateRow = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown()).find(
      (row) => row.id === LEGACY_QUICK_START_TRAFFIC_ROW_ID,
    );

    expect(registryRow?.path).toBe(LEGACY_QUICK_START_TRAFFIC_PATH);
    expect(registryRow?.section).toBe("Redirect shim");
    expect(registryRow?.note).toBe(LEGACY_QUICK_START_TRAFFIC_NOTE);
    expect(templateRow?.path).toBe(LEGACY_QUICK_START_TRAFFIC_PATH);
    expect(templateRow?.section).toBe("Redirect shim");
    expect(templateRow?.notes).toBe(LEGACY_QUICK_START_TRAFFIC_NOTE);
    expect(templateRow?.notes.toLowerCase()).toContain("legacy");
    expect(templateRow?.notes).toContain("/get-started");
    expect(templateRow?.notes).not.toMatch(/pagecontextualhelp/i);
  });
});
