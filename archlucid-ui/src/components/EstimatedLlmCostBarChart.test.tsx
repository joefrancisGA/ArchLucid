import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EstimatedLlmCostBarChart } from "@/components/EstimatedLlmCostBarChart";

describe("EstimatedLlmCostBarChart", () => {
  it("shows a polished empty state when all daily buckets are zero", () => {
    render(
      <EstimatedLlmCostBarChart
        currencyCode="USD"
        daily={[
          {
            bucketUtc: "2026-07-01T00:00:00.000Z",
            estimatedCostUsd: 0,
            promptTokens: 0,
            completionTokens: 0,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("llm-daily-usage-empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start a review/i })).toHaveAttribute("href", "/architecture/reviews/new");
  });
});
