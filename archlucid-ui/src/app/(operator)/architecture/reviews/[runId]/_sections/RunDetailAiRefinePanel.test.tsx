import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RunDetailAiRefinePanel } from "./RunDetailAiRefinePanel";

const fetchContext = vi.fn();
const runReasoning = vi.fn();

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

vi.mock("@/lib/architecture-intelligence-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/architecture-intelligence-api")>();

  return {
    ...actual,
    fetchArchitectureIntelligenceProductSourceContext: (...args: unknown[]) => fetchContext(...args),
    runArchitectureIntelligenceReasoning: (...args: unknown[]) => runReasoning(...args),
  };
});

describe("RunDetailAiRefinePanel", () => {
  beforeEach(() => {
    fetchContext.mockReset();
    runReasoning.mockReset();
  });

  it("loads product intake and offers refine-and-publish", async () => {
    fetchContext.mockResolvedValue({
      runId: "run-abc",
      sourceTexts: [
        {
          fileName: "architecture-description.txt",
          contentType: "text/plain",
          content: "Public API without authentication.",
        },
      ],
      declaredPriorities: ["security"],
    });

    render(<RunDetailAiRefinePanel runId="run-abc" />);

    await waitFor(() => {
      expect(screen.getByTestId("run-detail-ai-refine-run")).toBeInTheDocument();
    });

    expect(screen.getByText(/Intake loaded/)).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-architecture-intelligence-link")).toHaveAttribute(
      "href",
      expect.stringContaining("architecture-intelligence"),
    );
  });

  it("runs closed-loop reasoning with publish and shows results", async () => {
    fetchContext.mockResolvedValue({
      runId: "run-abc",
      sourceTexts: [
        {
          fileName: "architecture-description.txt",
          contentType: "text/plain",
          content: "Public API without authentication.",
        },
      ],
    });
    runReasoning.mockResolvedValue({
      runId: "run-abc",
      model: { elements: [{ id: "1" }] },
      integrityPassedFindingIds: ["f1", "f2"],
      publishedToProduct: true,
      publishedRecommendationCount: 1,
      budgetEstimatedCostUsd: 0.42,
      budgetRemainingUsd: 39.5,
    });

    render(<RunDetailAiRefinePanel runId="run-abc" />);

    await waitFor(() => {
      expect(screen.getByTestId("run-detail-ai-refine-run")).toBeEnabled();
    });

    screen.getByTestId("run-detail-ai-refine-run").click();

    await waitFor(() => {
      expect(screen.getByTestId("run-detail-ai-refine-results")).toBeInTheDocument();
    });

    expect(runReasoning).toHaveBeenCalledWith(
      expect.objectContaining({
        publishToProduct: true,
        runId: "run-abc",
        reviewTier: "Standard",
      }),
    );
    expect(screen.getByTestId("run-detail-ai-refine-results")).toHaveTextContent(
      "Integrity-passed findings: 2",
    );
    expect(screen.getByTestId("architecture-intelligence-product-round-trip")).toBeInTheDocument();
  });

  it("points operators at the full tool when intake is empty", async () => {
    fetchContext.mockResolvedValue({
      runId: "run-abc",
      sourceTexts: [],
    });

    render(<RunDetailAiRefinePanel runId="run-abc" />);

    await waitFor(() => {
      expect(screen.getByText(/No architecture intake/)).toBeInTheDocument();
    });

    expect(screen.queryByTestId("run-detail-ai-refine-run")).not.toBeInTheDocument();
  });
});
