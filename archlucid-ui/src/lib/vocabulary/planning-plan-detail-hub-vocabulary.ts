/**
 * TB-2282 — Plan detail ≠ Improvement planning hub vocabulary rail.
 *
 * Why two planning surfaces exist:
 * - Improvement planning (`/insights/improvement-planning`) is the hub for
 *   derived themes and plans from architecture package feedback.
 * - Plan detail (`/insights/improvement-planning/plans/[planId]`) inspects one
 *   derived improvement plan.
 *
 * They stay separate because browsing the planning hub is not inspecting a
 * single plan. Distinct from Planning ≠ reviews (TB-2238), which reconciles
 * planning with the architecture reviews inventory.
 */

import { PLANNING_PATH } from "@/lib/planning-route";

export type PlanningPlanDetailHubSurfaceId = "improvement-planning" | "plan-detail";

export type PlanningPlanDetailHubLink = {
  readonly id: PlanningPlanDetailHubSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type PlanningPlanDetailHubVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly planningHubLink: PlanningPlanDetailHubLink;
  readonly planDetailLink: PlanningPlanDetailHubLink;
};

export const PLANNING_PLAN_DETAIL_HUB_HEADING =
  "Plan detail and Improvement planning do different jobs" as const;

export const PLANNING_PLAN_DETAIL_HUB_WHY_TWO =
  "Improvement planning is the hub for derived themes and plans from architecture package feedback. Plan detail inspects one derived improvement plan. The hub is not a single plan workspace — open the peer when you need the other job." as const;

export const PLANNING_PLAN_DETAIL_HUB_COMPACT_LINE =
  "Improvement planning lists themes and plans; Plan detail inspects one plan — open the other when you need both." as const;

export const PLANNING_PLAN_DETAIL_HUB_PLANNING_LINK: PlanningPlanDetailHubLink = {
  id: "improvement-planning",
  label: "Improvement planning",
  href: PLANNING_PATH,
  whenToUse: "Browse derived themes and plans from architecture package feedback.",
};

/** Plan detail is per-plan; href uses the planning hub as the stable peer home. */
export const PLANNING_PLAN_DETAIL_HUB_PLAN_DETAIL_LINK: PlanningPlanDetailHubLink = {
  id: "plan-detail",
  label: "Plan detail",
  href: PLANNING_PATH,
  whenToUse: "Inspect one derived improvement plan.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildPlanningPlanDetailHubVocabulary(): PlanningPlanDetailHubVocabularyModel {
  return {
    heading: PLANNING_PLAN_DETAIL_HUB_HEADING,
    whyTwo: PLANNING_PLAN_DETAIL_HUB_WHY_TWO,
    compactLine: PLANNING_PLAN_DETAIL_HUB_COMPACT_LINE,
    planningHubLink: PLANNING_PLAN_DETAIL_HUB_PLANNING_LINK,
    planDetailLink: PLANNING_PLAN_DETAIL_HUB_PLAN_DETAIL_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolvePlanningPlanDetailHubPeerLink(
  currentSurfaceId: PlanningPlanDetailHubSurfaceId,
): PlanningPlanDetailHubLink {
  if (currentSurfaceId === "improvement-planning") {
    return PLANNING_PLAN_DETAIL_HUB_PLAN_DETAIL_LINK;
  }

  return PLANNING_PLAN_DETAIL_HUB_PLANNING_LINK;
}
