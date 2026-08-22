import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitectureDraftAiRefinePanel } from "./ArchitectureDraftAiRefinePanel";
import { ARCHITECTURE_DRAFT_AI_REFINE_HEADING } from "@/lib/architecture/architecture-draft-ai-refine-copy";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import { architectureIntelligenceReviewTierLabel } from "@/lib/architecture/architecture-intelligence-review-tier";

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
    runArchitectureIntelligenceReasoning: (...args: unknown[]) => runReasoning(...args),
  };
});

const draftFields = {
  freeTextIntent: "Public API without authentication.",
  businessOutcome: "Secure customer access",
  systemName: "Claims intake",
  structuredBrief: emptyArchitectureDraftStructuredBrief(),
};

describe("ArchitectureDraftAiRefinePanel", () => {
  beforeEach(() => {
    runReasoning.mockReset();
    budgetGate.blocksLlmExecution = false;
  });

  it("runs closed-loop reasoning without publish when no linked review exists", async () => {
    runReasoning.mockResolvedValue({
      runId: "ai-run-1",
      model: { elements: [{ id: "1" }] },
      integrityPassedFindingIds: ["f1"],
      publishedToProduct: false,
      budgetEstimatedCostUsd: 0.2,
      budgetRemainingUsd: 39.8,
    });

    render(<ArchitectureDraftAiRefinePanel fields={draftFields} linkedReviewId={null} />);

    expect(screen.getByRole("heading", { name: ARCHITECTURE_DRAFT_AI_REFINE_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-ai-refine-depth")).toHaveTextContent(
      architectureIntelligenceReviewTierLabel("Standard"),
    );
    expect(screen.getByTestId("architecture-draft-ai-refine-run")).toHaveTextContent(
      "Refine architecture with AI",
    );
    expect(screen.getByTestId("architecture-draft-ai-refine-budget")).toBeInTheDocument();

    screen.getByTestId("architecture-draft-ai-refine-run").click();

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-ai-refine-results")).toBeInTheDocument();
    });

    expect(runReasoning).toHaveBeenCalledWith(
      expect.objectContaining({
        publishToProduct: false,
        reviewTier: "Standard",
      }),
    );
    expect(screen.getByText(/Start a review when you are ready/)).toBeInTheDocument();
  });

  it("publishes into the linked review when one exists", async () => {
    runReasoning.mockResolvedValue({
      runId: "run-001",
      model: { elements: [{ id: "1" }] },
      integrityPassedFindingIds: ["f1", "f2"],
      publishedToProduct: true,
      publishedRecommendationCount: 1,
    });

    render(<ArchitectureDraftAiRefinePanel fields={draftFields} linkedReviewId="run-001" />);

    expect(screen.getByTestId("architecture-draft-ai-refine-run")).toHaveTextContent(
      "Refine and publish to linked review",
    );

    screen.getByTestId("architecture-draft-ai-refine-run").click();

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-product-round-trip")).toBeInTheDocument();
    });

    expect(runReasoning).toHaveBeenCalledWith(
      expect.objectContaining({
        publishToProduct: true,
        runId: "run-001",
      }),
    );
  });

  it("asks for overview content before enabling refine", () => {
    render(
      <ArchitectureDraftAiRefinePanel
        fields={{
          freeTextIntent: "",
          businessOutcome: "",
          systemName: "",
          structuredBrief: emptyArchitectureDraftStructuredBrief(),
        }}
      />,
    );

    expect(screen.queryByTestId("architecture-draft-ai-refine-run")).not.toBeInTheDocument();
    expect(screen.getByText(/Add a system name or architecture overview/)).toBeInTheDocument();
  });

  it("explains why refine is disabled when AI budget is exhausted", () => {
    budgetGate.blocksLlmExecution = true;

    render(<ArchitectureDraftAiRefinePanel fields={draftFields} />);

    expect(screen.getByTestId("architecture-draft-ai-refine-run")).toBeDisabled();
    expect(screen.getByTestId("architecture-draft-ai-refine-disabled-hint")).toHaveTextContent(/AI budget/i);
    expect(screen.getByTestId("architecture-draft-ai-refine-budget-blocked")).toBeInTheDocument();
  });
});
