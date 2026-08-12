import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LlmBudgetStatusPill } from "@/components/llm/LlmBudgetStatusPill";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

const fetchCached = vi.hoisted(() => vi.fn());

const navAuthMock = vi.hoisted(() => ({
  callerAuthorityRank: 3,
  isAuthorityLoading: false,
}));

vi.mock("@/lib/llm-monthly-budget-status", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm-monthly-budget-status")>();

  return {
    ...actual,
    fetchLlmMonthlyDollarBudgetStatusCached: fetchCached,
  };
});

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => navAuthMock,
  useNavCallerAuthorityRank: () => navAuthMock.callerAuthorityRank,
}));

vi.mock("@/lib/auth-config", () => ({
  AUTH_MODE: "development-bypass",
}));

describe("LlmBudgetStatusPill", () => {
  beforeEach(() => {
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;
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

    expect(pill).toHaveTextContent("AI budget: 24%");
    expect(pill.className).toMatch(/al-status-warn/);
    expect(pill.className).toMatch(/text-\[11px\]/);
  });

  it("opens popover with utilization meter", async () => {
    render(<LlmBudgetStatusPill />);

    const pill = await screen.findByTestId("llm-budget-status-pill");
    fireEvent.click(pill);

    expect(await screen.findByTestId("llm-budget-status-pill-popover")).toBeInTheDocument();
    expect(await screen.findByTestId("llm-budget-utilization-meter")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open AI usage and budget" })).toHaveAttribute(
      "href",
      "/administration/ai-usage",
    );
    expect(screen.getByRole("link", { name: "Billing & plans" })).toHaveAttribute(
      "href",
      "/administration/billing#billing-usage",
    );
  });

  it("hides the pill when remaining budget is healthy (ok tone)", async () => {
    fetchCached.mockResolvedValue({
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: false,
      utcMonth: "2026-05",
      hardCutoffUsdPerUtcMonth: 75,
      effectiveHardCapUsd: 75,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 5,
      assumedNextCallReservationUsd: 1,
      hardCapUtilizationFraction: 0.05,
      warnFraction: 0.75,
    });

    render(<LlmBudgetStatusPill />);

    await waitFor(() => {
      expect(fetchCached).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("llm-budget-status-pill")).not.toBeInTheDocument();
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

  it("renders nothing below AdminAuthority", async () => {
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;

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

    expect(await screen.findByTestId("llm-budget-status-pill")).toHaveTextContent("AI budget: 0% — paused");
  });
});
