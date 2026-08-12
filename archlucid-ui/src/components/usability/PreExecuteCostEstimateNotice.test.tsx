import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PreExecuteCostEstimateNotice } from "@/components/usability/PreExecuteCostEstimateNotice";
import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";

const useGate = vi.fn();

vi.mock("@/hooks/use-llm-monthly-budget-execution-gate", () => ({
  useLlmMonthlyBudgetExecutionGate: () => useGate(),
}));

function createStatus(
  overrides: Partial<LlmMonthlyDollarBudgetStatus> = {},
): LlmMonthlyDollarBudgetStatus {
  return {
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
    remainingBudgetUsd: 50,
    ...overrides,
  };
}

describe("PreExecuteCostEstimateNotice (TB-2233)", () => {
  it("speaks remaining allowance from the budget gate without inventing package cost", () => {
    useGate.mockReturnValue({
      loading: false,
      status: createStatus(),
      blocksLlmExecution: false,
    });

    render(<PreExecuteCostEstimateNotice />);

    const notice = screen.getByTestId("pre-execute-cost-estimate-notice");
    expect(notice).toHaveAttribute("data-kind", "allotment");
    expect(screen.getByTestId("pre-execute-cost-estimate-notice-message")).toHaveTextContent(
      /included in your plan's AI usage/i,
    );
    expect(screen.getByTestId("pre-execute-cost-estimate-notice-message")).toHaveTextContent(
      "$50.00",
    );
    expect(
      screen.queryByTestId("pre-execute-cost-estimate-notice-honesty"),
    ).not.toBeInTheDocument();
  });

  it("renders allowance-only teaching as a quiet inline line, not a bordered callout", () => {
    useGate.mockReturnValue({
      loading: false,
      status: createStatus(),
      blocksLlmExecution: false,
    });

    render(<PreExecuteCostEstimateNotice />);

    const notice = screen.getByTestId("pre-execute-cost-estimate-notice");
    expect(notice).toHaveAttribute("data-presentation", "inline");
    expect(notice.className).not.toMatch(/border/);
    expect(notice).toHaveAttribute("aria-label", "Included AI usage");
    expect(notice).not.toHaveAttribute("aria-labelledby");
    expect(
      screen.queryByRole("heading", { name: /included ai usage/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps the callout heading when a dollar estimate is actually asserted", () => {
    useGate.mockReturnValue({
      loading: false,
      status: createStatus(),
      blocksLlmExecution: false,
    });

    render(
      <PreExecuteCostEstimateNotice
        estimate={{
          previewActive: true,
          estimatedCostUsdLow: 0.04,
          estimatedCostUsdHigh: 0.72,
        }}
      />,
    );

    const notice = screen.getByTestId("pre-execute-cost-estimate-notice");
    expect(notice).toHaveAttribute("data-presentation", "callout");
    expect(notice.className).toMatch(/border/);
    expect(screen.getByRole("heading", { name: /included ai usage/i })).toBeInTheDocument();
  });

  it("shows a Real-mode range when estimate props are supplied", () => {
    useGate.mockReturnValue({
      loading: false,
      status: createStatus({ remainingBudgetUsd: 40 }),
      blocksLlmExecution: false,
    });

    render(
      <PreExecuteCostEstimateNotice
        estimate={{
          previewActive: true,
          estimatedCostUsdLow: 0.04,
          estimatedCostUsdHigh: 0.72,
          pricingUsesIllustrativeUsdRates: true,
        }}
      />,
    );

    expect(screen.getByTestId("pre-execute-cost-estimate-notice")).toHaveAttribute(
      "data-kind",
      "range",
    );
    expect(screen.getByTestId("pre-execute-cost-estimate-notice-message")).toHaveTextContent(
      /architecture package/i,
    );
    expect(screen.getByTestId("pre-execute-cost-estimate-notice-message")).toHaveTextContent(
      "$0.04",
    );
    expect(screen.getByTestId("pre-execute-cost-estimate-notice-honesty")).toHaveTextContent(
      /illustrative list rates/i,
    );
  });

  it("uses caller allowance props and skips inventing dollars when preview inactive", () => {
    useGate.mockReturnValue({
      loading: false,
      status: createStatus({ remainingBudgetUsd: 99 }),
      blocksLlmExecution: false,
    });

    render(
      <PreExecuteCostEstimateNotice
        estimate={{
          previewActive: false,
          estimatedCostUsdLow: 9.99,
          estimatedCostUsdHigh: 19.99,
        }}
        monthlyBudgetMonitoringActive={true}
        remainingBudgetUsd={12}
      />,
    );

    const message = screen.getByTestId("pre-execute-cost-estimate-notice-message");
    expect(message).toHaveTextContent("$12.00");
    expect(message).not.toHaveTextContent("$9.99");
    expect(message).not.toHaveTextContent("$19.99");
  });

  it("honors a custom test id", () => {
    useGate.mockReturnValue({
      loading: false,
      status: null,
      blocksLlmExecution: false,
    });

    render(<PreExecuteCostEstimateNotice testId="draft-cost-teaching" useBudgetGate={false} />);

    expect(screen.getByTestId("draft-cost-teaching")).toBeInTheDocument();
    expect(screen.getByTestId("draft-cost-teaching-message")).toHaveTextContent(
      /included in your plan's AI usage/i,
    );
    expect(screen.getByTestId("draft-cost-teaching-message")).not.toHaveTextContent("$");
  });
});
