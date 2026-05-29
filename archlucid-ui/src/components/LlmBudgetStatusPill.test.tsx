import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LlmBudgetStatusPill } from "@/components/LlmBudgetStatusPill";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

const fetchCached = vi.hoisted(() => vi.fn());

const navAuthMock = vi.hoisted(() => ({
  callerAuthorityRank: 2,
  isAuthorityLoading: false,
}));

const buyerPolishedMock = vi.hoisted(() => ({ value: false }));

vi.mock("@/lib/llm-monthly-budget-status", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm-monthly-budget-status")>();

  return {
    ...actual,
    fetchLlmMonthlyDollarBudgetStatusCached: fetchCached,
  };
});

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => navAuthMock,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => buyerPolishedMock.value,
  };
});

vi.mock("@/lib/auth-config", () => ({
  AUTH_MODE: "development-bypass",
}));

describe("LlmBudgetStatusPill", () => {
  beforeEach(() => {
    buyerPolishedMock.value = false;
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;
    navAuthMock.isAuthorityLoading = false;
    fetchCached.mockResolvedValue({
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: false,
      utcMonth: "2026-05",
      hardCutoffUsdPerUtcMonth: 75,
      effectiveHardCapUsd: 75,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 56,
      assumedNextCallReservationUsd: 1,
      hardCapUtilizationFraction: 0.76,
      warnFraction: 0.75,
    });
  });

  it("renders warn-toned pill label when budget headroom is low", async () => {
    render(<LlmBudgetStatusPill />);

    const pill = await screen.findByTestId("llm-budget-status-pill");

    expect(pill).toHaveTextContent("AI budget: 24% left");
    expect(pill.className).toMatch(/amber/);
  });

  it("opens popover with utilization meter", async () => {
    render(<LlmBudgetStatusPill />);

    const pill = await screen.findByTestId("llm-budget-status-pill");
    fireEvent.click(pill);

    expect(await screen.findByTestId("llm-budget-status-pill-popover")).toBeInTheDocument();
    expect(await screen.findByTestId("llm-budget-utilization-meter")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage budget" })).toHaveAttribute("href", "/settings/cost-reporting");
  });

  it("renders nothing when monitoring is inactive", async () => {
    fetchCached.mockResolvedValue({
      monthlyBudgetMonitoringActive: false,
      blocksAdditionalLlmExecution: false,
      utcMonth: "2026-05",
      hardCutoffUsdPerUtcMonth: null,
      effectiveHardCapUsd: null,
      purchasedCapBumpUsd: null,
      estimatedUsdPressure: null,
      assumedNextCallReservationUsd: null,
      hardCapUtilizationFraction: null,
      warnFraction: null,
    });

    render(<LlmBudgetStatusPill />);

    await waitFor(() => {
      expect(fetchCached).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("llm-budget-status-pill")).not.toBeInTheDocument();
  });

  it("renders nothing in buyer-polished shell mode", async () => {
    buyerPolishedMock.value = true;

    render(<LlmBudgetStatusPill />);

    await waitFor(() => {
      expect(screen.queryByTestId("llm-budget-status-pill")).not.toBeInTheDocument();
    });

    expect(fetchCached).not.toHaveBeenCalled();
  });

  it("renders nothing below ExecuteAuthority", async () => {
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.ReadAuthority;

    render(<LlmBudgetStatusPill />);

    await waitFor(() => {
      expect(screen.queryByTestId("llm-budget-status-pill")).not.toBeInTheDocument();
    });

    expect(fetchCached).not.toHaveBeenCalled();
  });

  it("shows paused suffix at hard cap", async () => {
    fetchCached.mockResolvedValue({
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: true,
      utcMonth: "2026-05",
      hardCutoffUsdPerUtcMonth: 75,
      effectiveHardCapUsd: 75,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 75,
      assumedNextCallReservationUsd: 1,
      hardCapUtilizationFraction: 1,
      warnFraction: 0.75,
    });

    render(<LlmBudgetStatusPill />);

    expect(await screen.findByTestId("llm-budget-status-pill")).toHaveTextContent("AI budget: 0% left — paused");
  });
});
