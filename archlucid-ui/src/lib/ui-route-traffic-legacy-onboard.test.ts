import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";
import { findUiRouteTrafficRow } from "@/lib/ui-route-traffic/registry";
import {
  LEGACY_ONBOARD_TRAFFIC_NOTE,
  LEGACY_ONBOARD_TRAFFIC_PATH,
  LEGACY_ONBOARD_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-legacy-onboard";

describe("ui-route-traffic legacy onboard (TB-1798)", () => {
  it("tracks OXX as a redirect-only workbook row", () => {
    const registryRow = findUiRouteTrafficRow(LEGACY_ONBOARD_TRAFFIC_ROW_ID);
    const templateRow = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown()).find(
      (row) => row.id === LEGACY_ONBOARD_TRAFFIC_ROW_ID,
    );

    expect(registryRow?.path).toBe(LEGACY_ONBOARD_TRAFFIC_PATH);
    expect(registryRow?.section).toBe("Redirect shim");
    expect(registryRow?.note).toBe(LEGACY_ONBOARD_TRAFFIC_NOTE);
    expect(templateRow?.path).toBe(LEGACY_ONBOARD_TRAFFIC_PATH);
    expect(templateRow?.section).toBe("Redirect shim");
    expect(templateRow?.notes).toBe(LEGACY_ONBOARD_TRAFFIC_NOTE);
    expect(templateRow?.notes.toLowerCase()).toContain("legacy");
    expect(templateRow?.notes).toContain("first-review-guide");
    expect(templateRow?.notes).not.toMatch(/pagecontextualhelp/i);
  });
});
