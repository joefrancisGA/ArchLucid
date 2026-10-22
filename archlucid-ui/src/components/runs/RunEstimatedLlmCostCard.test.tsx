import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { RunEstimatedLlmCostCard } from "@/components/runs/RunEstimatedLlmCostCard";

describe("RunEstimatedLlmCostCard", () => {
  it("renders cost and token telemetry when estimate is present", () => {
    render(
      <RunEstimatedLlmCostCard
        estimate={{
          estimatedCostUsd: 0.42,
          tokenCounts: { prompt: 1200, completion: 800 },
          model: "gpt-4o-mini",
          costEstimationBasis: "estimated-from-configured-rates",
        }}
      />,
    );

    expect(screen.getByTestId("run-cost-telemetry-card")).toBeInTheDocument();
    expect(screen.getByText("Cost & telemetry")).toBeInTheDocument();
    expect(screen.getByText("$0.42")).toBeInTheDocument();
    expect(screen.getByText("2,000")).toBeInTheDocument();
    expect(screen.getByText("Estimated from configured model rates")).toBeInTheDocument();
  });

  it("labels omitted token counts without inventing a USD total", () => {
    render(<RunEstimatedLlmCostCard estimate={undefined} />);

    expect(screen.getByText("Token count was not stored.")).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it("keeps stored zero token counts distinct from omission", () => {
    render(
      <RunEstimatedLlmCostCard
        estimate={{
          tokenCounts: { prompt: 0, completion: 0 },
          costEstimationBasis: "estimated-from-configured-rates",
        }}
      />,
    );

    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Token count was not stored.")).not.toBeInTheDocument();
  });
});
