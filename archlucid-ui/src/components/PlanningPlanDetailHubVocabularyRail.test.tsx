import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanningPlanDetailHubVocabularyRail } from "@/components/PlanningPlanDetailHubVocabularyRail";
import {
  PLANNING_PLAN_DETAIL_HUB_COMPACT_LINE,
  PLANNING_PLAN_DETAIL_HUB_HEADING,
  PLANNING_PLAN_DETAIL_HUB_PLANNING_LINK,
  PLANNING_PLAN_DETAIL_HUB_PLAN_DETAIL_LINK,
  PLANNING_PLAN_DETAIL_HUB_WHY_TWO,
} from "@/lib/planning-plan-detail-hub-vocabulary";

describe("PlanningPlanDetailHubVocabularyRail (TB-2282)", () => {
  it("renders planning hub strip with peer link to plan detail", () => {
    render(
      <PlanningPlanDetailHubVocabularyRail currentSurfaceId="improvement-planning" />,
    );

    const strip = screen.getByTestId("planning-plan-detail-hub-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "improvement-planning");
    expect(strip.textContent ?? "").toContain(PLANNING_PLAN_DETAIL_HUB_COMPACT_LINE);

    const peer = screen.getByTestId("planning-plan-detail-hub-vocabulary-peer-link");
    expect(peer).toHaveTextContent(PLANNING_PLAN_DETAIL_HUB_PLAN_DETAIL_LINK.label);
    expect(peer).toHaveAttribute("href", PLANNING_PLAN_DETAIL_HUB_PLAN_DETAIL_LINK.href);
  });

  it("renders plan detail strip with peer link to improvement planning", () => {
    render(<PlanningPlanDetailHubVocabularyRail currentSurfaceId="plan-detail" />);

    expect(screen.getByTestId("planning-plan-detail-hub-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "plan-detail",
    );

    const peer = screen.getByTestId("planning-plan-detail-hub-vocabulary-peer-link");
    expect(peer).toHaveTextContent(PLANNING_PLAN_DETAIL_HUB_PLANNING_LINK.label);
    expect(peer).toHaveAttribute("href", PLANNING_PLAN_DETAIL_HUB_PLANNING_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <PlanningPlanDetailHubVocabularyRail
        currentSurfaceId="improvement-planning"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("planning-plan-detail-hub-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(PLANNING_PLAN_DETAIL_HUB_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PLANNING_PLAN_DETAIL_HUB_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("planning-plan-detail-hub-vocabulary-current")).toHaveTextContent(
      PLANNING_PLAN_DETAIL_HUB_PLANNING_LINK.label,
    );
  });
});
