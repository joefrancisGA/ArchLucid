import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailOperatorPipelineToolsCollapsible } from "./RunDetailOperatorPipelineToolsCollapsible";

vi.mock("@/hooks/use-llm-monthly-budget-execution-gate", () => ({
  useLlmMonthlyBudgetExecutionGate: () => ({
    loading: false,
    status: {
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: false,
      utcMonth: "2026-08",
      hardCutoffUsdPerUtcMonth: 75,
      effectiveHardCapUsd: 75,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 25,
      assumedNextCallReservationUsd: 0.5,
      hardCapUtilizationFraction: 0.33,
      warnFraction: 0.75,
      remainingBudgetUsd: 40,
    },
    blocksLlmExecution: false,
  }),
}));

describe("RunDetailOperatorPipelineToolsCollapsible", () => {
  it("frames architecture intelligence as in-review AI refinement with budget notice", () => {
    render(<RunDetailOperatorPipelineToolsCollapsible runId="run-abc" />);

    expect(screen.getByTestId("run-detail-refine-with-ai")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-refine-ai-budget-notice")).toHaveTextContent(
      "Architecture reasoning uses AI budget.",
    );
    expect(screen.getByTestId("run-detail-architecture-intelligence-link")).toHaveTextContent(
      "Refine this review with AI",
    );
    expect(screen.getByRole("link", { name: "Refine this review with AI" })).toHaveAttribute(
      "href",
      expect.stringContaining("architecture-intelligence"),
    );
  });
});
