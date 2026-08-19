import { describe, expect, it } from "vitest";

import {
  PLANNING_PLAN_DETAIL_HUB_COMPACT_LINE,
  PLANNING_PLAN_DETAIL_HUB_HEADING,
  PLANNING_PLAN_DETAIL_HUB_PLANNING_LINK,
  PLANNING_PLAN_DETAIL_HUB_PLAN_DETAIL_LINK,
  PLANNING_PLAN_DETAIL_HUB_WHY_TWO,
  buildPlanningPlanDetailHubVocabulary,
  resolvePlanningPlanDetailHubPeerLink,
} from "@/lib/vocabulary/planning-plan-detail-hub-vocabulary";
import { PLANNING_PATH } from "@/lib/planning-route";

describe("planning-plan-detail-hub-vocabulary (TB-2282)", () => {
  it("explains plan detail vs improvement planning hub and deep-links the hub", () => {
    const model = buildPlanningPlanDetailHubVocabulary();

    expect(model.heading).toBe(PLANNING_PLAN_DETAIL_HUB_HEADING);
    expect(model.heading.toLowerCase()).toContain("plan detail");
    expect(model.heading.toLowerCase()).toContain("improvement planning");
    expect(model.whyTwo).toBe(PLANNING_PLAN_DETAIL_HUB_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("theme");
    expect(model.whyTwo.toLowerCase()).toContain("plan");
    expect(model.compactLine).toBe(PLANNING_PLAN_DETAIL_HUB_COMPACT_LINE);

    expect(model.planningHubLink).toEqual(PLANNING_PLAN_DETAIL_HUB_PLANNING_LINK);
    expect(model.planningHubLink.href).toBe(PLANNING_PATH);
    expect(model.planningHubLink.href).toBe("/insights/improvement-planning");

    expect(model.planDetailLink).toEqual(PLANNING_PLAN_DETAIL_HUB_PLAN_DETAIL_LINK);
    expect(model.planDetailLink.href).toBe(PLANNING_PATH);
  });

  it("resolves the peer surface from hub and plan detail", () => {
    expect(resolvePlanningPlanDetailHubPeerLink("improvement-planning")).toEqual(
      PLANNING_PLAN_DETAIL_HUB_PLAN_DETAIL_LINK,
    );

    expect(resolvePlanningPlanDetailHubPeerLink("plan-detail")).toEqual(
      PLANNING_PLAN_DETAIL_HUB_PLANNING_LINK,
    );
  });
});
