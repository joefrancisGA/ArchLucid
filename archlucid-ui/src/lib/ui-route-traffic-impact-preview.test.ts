import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  IMPACT_PREVIEW_TRAFFIC_NOTE,
  IMPACT_PREVIEW_TRAFFIC_PATH,
  IMPACT_PREVIEW_TRAFFIC_ROW_ID,
  IMPACT_PREVIEW_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-impact-preview";

describe("ui-route-traffic-impact-preview (INI)", () => {
  it("tracks impact-preview with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === IMPACT_PREVIEW_TRAFFIC_ROW_ID);
    const exx = rows.find((candidate) => candidate.id === "EXX");

    expect(exx).toBeUndefined();
    expect(row).toBeDefined();
    expect(row?.path).toBe(IMPACT_PREVIEW_TRAFFIC_PATH);
    expect(row?.section).toBe(IMPACT_PREVIEW_TRAFFIC_SECTION);
    expect(row?.notes).toBe(IMPACT_PREVIEW_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
