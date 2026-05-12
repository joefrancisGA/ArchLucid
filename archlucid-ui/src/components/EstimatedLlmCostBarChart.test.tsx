import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EstimatedLlmCostBarChart } from "./EstimatedLlmCostBarChart";

describe("EstimatedLlmCostBarChart", () => {
  it("renders empty message when no points", () => {
    render(<EstimatedLlmCostBarChart daily={[]} currencyCode="USD" />);
    expect(screen.getByText(/No cost data/i)).toBeInTheDocument();
  });

  it("renders bars for daily buckets", () => {
    const { container } = render(
      <EstimatedLlmCostBarChart
        currencyCode="USD"
        daily={[
          {
            bucketUtc: "2026-05-10T00:00:00.000Z",
            estimatedCostUsd: 10,
            promptTokens: 100,
            completionTokens: 20,
          },
          {
            bucketUtc: "2026-05-11T00:00:00.000Z",
            estimatedCostUsd: 20,
            promptTokens: 200,
            completionTokens: 40,
          },
        ]}
      />,
    );

    expect(container.querySelectorAll(".rounded-t").length).toBe(2);
  });
});
