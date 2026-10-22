import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RunDetailAiRefinePanel } from "./RunDetailAiRefinePanel";

const fetchContext = vi.fn();
const runReasoning = vi.fn();

const budgetGate = vi.hoisted(() => ({
  blocksLlmExecution: false,
}));

vi.mock("@/hooks/use-llm-monthly-budget-execution-gate", () => ({
  useLlmMonthlyBudgetExecutionGate: () => ({
    loading: false,
    status: {
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: budgetGate.blocksLlmExecution,
      utcMonth: "2026-08",
      hardCutoffUsdPerUtcMonth: 75,
      effectiveHardCapUsd: 75,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 25,
      assumedNextCallReservationUsd: 0.5,
      hardCapUtilizationFraction: budgetGate.blocksLlmExecution ? 1 : 0.33,
      warnFraction: 0.75,
      remainingBudgetUsd: budgetGate.blocksLlmExecution ? 0 : 40,
    },
    blocksLlmExecution: budgetGate.blocksLlmExecution,
  }),
}));

vi.mock("@/lib/architecture/architecture-intelligence-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/architecture/architecture-intelligence-api")>();

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
    budgetGate.blocksLlmExecution = false;
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
    expect(screen.getByTestId("run-detail-ai-refine-budget")).toBeInTheDocument();
  });

  it("explains why refine is disabled when AI budget is exhausted", async () => {
    budgetGate.blocksLlmExecution = true;
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

    render(<RunDetailAiRefinePanel runId="run-abc" />);

    await waitFor(() => {
      expect(screen.getByTestId("run-detail-ai-refine-run")).toBeDisabled();
    });

    expect(screen.getByTestId("run-detail-ai-refine-disabled-hint")).toHaveTextContent(/AI budget/i);
    expect(screen.getByTestId("run-detail-ai-refine-budget-blocked")).toBeInTheDocument();
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
    expect(screen.getByTestId("run-detail-ai-refine-headline")).toHaveTextContent(
      "Analysis complete · 2 evidence-backed findings",
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
