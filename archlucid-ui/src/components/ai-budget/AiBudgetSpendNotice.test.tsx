import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AiBudgetSpendNotice } from "./AiBudgetSpendNotice";
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

describe("AiBudgetSpendNotice", () => {
  it("renders nothing when budget status is unavailable", () => {
    useGate.mockReturnValue({ loading: false, status: null, blocksLlmExecution: false });

    const { container } = render(<AiBudgetSpendNotice action="Architecture reasoning" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when monthly budget monitoring is inactive", () => {
    useGate.mockReturnValue({
      loading: false,
      status: createStatus({ monthlyBudgetMonitoringActive: false }),
      blocksLlmExecution: false,
    });

    const { container } = render(<AiBudgetSpendNotice action="Architecture reasoning" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("states that the action spends budget and how much remains", () => {
    useGate.mockReturnValue({
      loading: false,
      status: createStatus(),
      blocksLlmExecution: false,
    });

    render(<AiBudgetSpendNotice action="Architecture reasoning" />);

    const notice = screen.getByTestId("ai-budget-spend-notice");
    expect(notice).toHaveTextContent("Architecture reasoning uses AI budget.");
    expect(notice).toHaveTextContent("$50.00");
  });

  it("includes a pre-flight cost estimate when supplied", () => {
    useGate.mockReturnValue({
      loading: false,
      status: createStatus(),
      blocksLlmExecution: false,
    });

    render(<AiBudgetSpendNotice action="Architecture reasoning" estimatedCostUsd={0.42} />);

    expect(screen.getByTestId("ai-budget-spend-notice")).toHaveTextContent("Estimated cost: $0.42.");
  });

  it("omits the remaining clause when the balance is unknown", () => {
    useGate.mockReturnValue({
      loading: false,
      status: createStatus({ remainingBudgetUsd: null }),
      blocksLlmExecution: false,
    });

    render(<AiBudgetSpendNotice action="Architecture reasoning" />);

    expect(screen.getByTestId("ai-budget-spend-notice")).not.toHaveTextContent("remaining");
  });

  it("alerts and links to AI usage when the budget is exhausted", () => {
    useGate.mockReturnValue({
      loading: false,
      status: createStatus({ blocksAdditionalLlmExecution: true, remainingBudgetUsd: 0 }),
      blocksLlmExecution: true,
    });

    render(<AiBudgetSpendNotice action="Architecture reasoning" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("architecture reasoning is unavailable");
    expect(screen.getByRole("link", { name: "Review AI usage" })).toBeInTheDocument();
  });

  it("honors a caller-supplied test id", () => {
    useGate.mockReturnValue({
      loading: false,
      status: createStatus(),
      blocksLlmExecution: false,
    });

    render(<AiBudgetSpendNotice action="Architecture reasoning" testId="custom-notice" />);

    expect(screen.getByTestId("custom-notice")).toBeInTheDocument();
  });
});
