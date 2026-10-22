import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PLANNING_PLAN_DETAIL_TRAFFIC_NOTE,
  PLANNING_PLAN_DETAIL_TRAFFIC_PATH,
  PLANNING_PLAN_DETAIL_TRAFFIC_ROW_ID,
  PLANNING_PLAN_DETAIL_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-planning-plan-detail";

describe("ui-route-traffic-planning-plan-detail (INL)", () => {
  it("tracks Improvement plan detail with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === PLANNING_PLAN_DETAIL_TRAFFIC_ROW_ID);
    const ppp = rows.find((candidate) => candidate.id === "PPP");

    expect(ppp).toBeUndefined();
    expect(row).toBeDefined();
    expect(row?.path).toBe(PLANNING_PLAN_DETAIL_TRAFFIC_PATH);
    expect(row?.section).toBe(PLANNING_PLAN_DETAIL_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PLANNING_PLAN_DETAIL_TRAFFIC_NOTE);
    expect(row?.notes).toContain("PlanningPlanDetailPageView");

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
