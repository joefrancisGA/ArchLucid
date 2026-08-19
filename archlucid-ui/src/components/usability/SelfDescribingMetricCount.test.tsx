import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SelfDescribingMetricCount } from "@/components/usability/SelfDescribingMetricCount";
import { workspaceOpenFindingsPresentation } from "@/lib/metric-count-presentation";

describe("SelfDescribingMetricCount", () => {
  it("renders a scoped clickable count", () => {
    render(
      <SelfDescribingMetricCount
        presentation={workspaceOpenFindingsPresentation(4)}
        testId="home-open-findings-metric"
      />,
    );

    expect(screen.getByTestId("home-open-findings-metric-value")).toHaveAttribute(
      "href",
      "/governance/findings?filter=open",
    );
    expect(screen.getByText(/open findings · workspace · open/)).toBeInTheDocument();
  });
});
