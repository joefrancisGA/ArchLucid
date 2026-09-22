import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScorecardKpiCareerHonestyStrip } from "@/components/scorecard/ScorecardKpiCareerHonestyStrip";
import { SCORECARD_KPI_CAREER_BLOCKED_TITLE } from "@/lib/scorecard/scorecard-kpi-career-honesty";

const honestyPresentationMock = vi.hoisted(() => ({ value: null as ReturnType<typeof import("@/hooks/use-scorecard-kpi-career-honesty").useScorecardKpiCareerHonesty> }));

vi.mock("@/hooks/use-scorecard-kpi-career-honesty", () => ({
  useScorecardKpiCareerHonesty: () => honestyPresentationMock.value,
}));

describe("ScorecardKpiCareerHonestyStrip (CG-034)", () => {
  beforeEach(() => {
    honestyPresentationMock.value = null;
  });

  it("renders nothing when honesty does not apply", () => {
    const { container } = render(
      <ScorecardKpiCareerHonestyStrip isSample={false} scopedRunId="run-1" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders blocked rehearsal strip above KPI context", () => {
    honestyPresentationMock.value = {
      cellId: "career-simulator-blocked",
      title: SCORECARD_KPI_CAREER_BLOCKED_TITLE,
      body: "Numbers stay visible for rehearsal.",
      kpiSectionQualifier: "Rehearsal metrics",
    };

    render(<ScorecardKpiCareerHonestyStrip isSample={false} scopedRunId="run-1" />);

    expect(screen.getByTestId("scorecard-kpi-career-honesty-strip")).toBeInTheDocument();
    expect(screen.getByTestId("scorecard-kpi-career-honesty-title")).toHaveTextContent(
      SCORECARD_KPI_CAREER_BLOCKED_TITLE,
    );
    expect(screen.getByTestId("scorecard-kpi-career-honesty-body")).toHaveTextContent(
      "Numbers stay visible for rehearsal.",
    );
  });
});
