import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PLANNING_TRAFFIC_NOTE,
  PLANNING_TRAFFIC_PATH,
  PLANNING_TRAFFIC_ROW_ID,
  PLANNING_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-planning";

describe("ui-route-traffic-planning (PLA)", () => {
  it("tracks Improvement planning with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === PLANNING_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(PLANNING_TRAFFIC_PATH);
    expect(row?.section).toBe(PLANNING_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PLANNING_TRAFFIC_NOTE);
    expect(row?.notes).toContain("PlanningPageView");
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 68");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
