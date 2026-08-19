import { render, screen, waitFor } from "@testing-library/react";
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

vi.mock("@/lib/architecture/architecture-intelligence-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/architecture/architecture-intelligence-api")>();

  return {
    ...actual,
    fetchArchitectureIntelligenceProductSourceContext: vi.fn(async () => ({
      runId: "run-abc",
      sourceTexts: [
        {
          fileName: "architecture-description.txt",
          contentType: "text/plain",
          content: "Public API without authentication.",
        },
      ],
    })),
    runArchitectureIntelligenceReasoning: vi.fn(),
  };
});

describe("RunDetailOperatorPipelineToolsCollapsible", () => {
  it("embeds in-place AI refine with budget notice", async () => {
    render(<RunDetailOperatorPipelineToolsCollapsible runId="run-abc" />);

    expect(screen.getByTestId("run-detail-refine-with-ai")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-refine-ai-budget-notice")).toHaveTextContent(
      "Architecture reasoning uses AI budget.",
    );
    expect(screen.getByTestId("run-detail-ai-refine-panel")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("run-detail-ai-refine-run")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Validate review" })).toHaveAttribute(
      "href",
      "/internal/validate-route?runId=run-abc",
    );
  });
});
