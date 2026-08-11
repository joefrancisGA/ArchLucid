import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ADMINISTRATION_SYSTEM_HEALTH_TRAFFIC_NOTE,
  ADMINISTRATION_SYSTEM_HEALTH_TRAFFIC_PATH,
  ADMINISTRATION_SYSTEM_HEALTH_TRAFFIC_ROW_ID,
  ADMINISTRATION_SYSTEM_HEALTH_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-administration-system-health";

describe("ui-route-traffic-administration-system-health (ADY)", () => {
  it("tracks the canonical Administration system-health path with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, ADMINISTRATION_SYSTEM_HEALTH_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ADMINISTRATION_SYSTEM_HEALTH_TRAFFIC_PATH);
    expect(row?.section).toBe(ADMINISTRATION_SYSTEM_HEALTH_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ADMINISTRATION_SYSTEM_HEALTH_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("PageContextualHelpButton");
    expect(row?.notes).toContain("Score 68");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
