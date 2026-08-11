import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ACCESSIBILITY_TRAFFIC_NOTE,
  ACCESSIBILITY_TRAFFIC_PATH,
  ACCESSIBILITY_TRAFFIC_ROW_ID,
  ACCESSIBILITY_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-accessibility";

describe("ui-route-traffic-accessibility (AXX)", () => {
  it("tracks Accessibility with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ACCESSIBILITY_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ACCESSIBILITY_TRAFFIC_PATH);
    expect(row?.section).toBe(ACCESSIBILITY_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ACCESSIBILITY_TRAFFIC_NOTE);
    expect(row?.notes).toContain("AccessibilityEvidenceOrientationStrip");

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
