import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ValueReportCareerHonestyStrip } from "@/components/insights/ValueReportCareerHonestyStrip";

const honestyMock = vi.hoisted(() => ({
  presentation: null as {
    kind: "scoped" | "period-mix";
    title: string;
    body: string;
  } | null,
}));

vi.mock("@/hooks/use-value-report-career-honesty", () => ({
  useValueReportCareerHonesty: () => honestyMock.presentation,
}));

describe("ValueReportCareerHonestyStrip (CG-090)", () => {
  beforeEach(() => {
    honestyMock.presentation = null;
  });

  it("renders nothing when route honesty does not apply", () => {
    const { container } = render(<ValueReportCareerHonestyStrip scopedRunId="run-1" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders route honesty strip for scoped rehearsal reviews", () => {
    honestyMock.presentation = {
      kind: "scoped",
      title: "Rehearsal incomplete — sponsor report is rehearsal only",
      body: "Not measured procurement savings.",
    };

    render(<ValueReportCareerHonestyStrip scopedRunId="run-1" />);

    expect(screen.getByTestId("value-report-career-honesty-strip")).toBeInTheDocument();
    expect(screen.getByTestId("value-report-career-honesty-title").textContent).toContain(
      "Rehearsal incomplete",
    );
  });
});
