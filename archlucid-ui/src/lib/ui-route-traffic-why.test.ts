import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  WHY_TRAFFIC_NOTE,
  WHY_TRAFFIC_PATH,
  WHY_TRAFFIC_ROW_ID,
  WHY_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-why";

describe("ui-route-traffic-why (WHY)", () => {
  it("tracks Why ArchLucid with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === WHY_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(WHY_TRAFFIC_PATH);
    expect(row?.section).toBe(WHY_TRAFFIC_SECTION);
    expect(row?.notes).toBe(WHY_TRAFFIC_NOTE);
    expect(row?.notes).toContain("WhyArchlucidMarketingView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
