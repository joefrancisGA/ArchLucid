import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";
import { EXECUTION_MODE_ROI_PERIOD_MIX_FOOTNOTE } from "@/lib/execution-mode-honesty";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

import { ExecutiveRoiTrendSection } from "./ExecutiveRoiTrendSection";

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("ExecutiveRoiTrendSection", () => {
  beforeEach(() => {
    buyerPolishedShellVitestOverride.value = false;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          points: [
            {
              snapshotUtc: "2026-04-15T00:00:00Z",
              totalEstimatedUsdSavings: 500,
              criticalSecurityFindings: 2,
              realRunCount: 3,
              simulatorRunCount: 2,
              realModeSavingsUsd: 300,
              isMixedMode: true,
            },
            {
              snapshotUtc: "2026-05-15T00:00:00Z",
              totalEstimatedUsdSavings: 100,
              criticalSecurityFindings: 0,
              realRunCount: 0,
              simulatorRunCount: 4,
              realModeSavingsUsd: 0,
              isMixedMode: false,
            },
          ],
        }),
      } as Response),
    );
  });

  afterEach(() => {
    buyerPolishedShellVitestOverride.value = null;
  });

  it("uses buyer-safe ROI trend copy without endpoint names when buyer polish is off (TB-1533)", async () => {
    renderWithQueryClient(<ExecutiveRoiTrendSection defaultTimeRange="all" showTimeRangeSelector />);

    await waitFor(() => {
      expect(screen.getByTestId("exec-roi-trend-chart")).toBeInTheDocument();
    });

    expect(screen.queryByText(/GET \/v1\/roi\/executive-summary\/history/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("exec-roi-trend-window-help")).toHaveTextContent("Showing the selected time range.");
  });

  it("shows mixed-mode footnote and simulator-only badge when history includes both modes", async () => {
    renderWithQueryClient(<ExecutiveRoiTrendSection defaultTimeRange="all" />);

    await waitFor(() => {
      expect(screen.getByTestId("exec-roi-trend-chart")).toBeInTheDocument();
    });

    expect(screen.getByTestId("exec-roi-trend-mixed-mode-footnote")).toHaveTextContent(
      EXECUTION_MODE_ROI_PERIOD_MIX_FOOTNOTE,
    );
    expect(screen.getByTestId("exec-roi-trend-simulator-only")).toHaveTextContent("Simulator-only");
    expect(screen.getByTestId("exec-roi-trend-svg-chart")).toBeInTheDocument();
  });

  it("uses design-system time-range control and loading skeleton (TB-1536, TB-1532)", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => undefined)),
    );

    renderWithQueryClient(<ExecutiveRoiTrendSection defaultTimeRange="all" showTimeRangeSelector />);

    expect(screen.getByTestId("exec-roi-trend-time-range")).toBeInTheDocument();
    expect(screen.getByTestId("exec-roi-trend-loading-skeleton")).toBeInTheDocument();
    expect(screen.getByText("Loading ROI trend…")).toHaveClass("sr-only");
  });

  it("uses Real-mode savings only on buyer-polished trend chart", async () => {
    buyerPolishedShellVitestOverride.value = true;

    renderWithQueryClient(<ExecutiveRoiTrendSection defaultTimeRange="all" />);

    await waitFor(() => {
      expect(screen.getByTestId("exec-roi-trend-chart")).toBeInTheDocument();
    });

    const bars = screen.getAllByTestId("exec-roi-trend-svg-bar");

    expect(bars).toHaveLength(2);
    expect(bars[0]?.parentElement?.querySelector("title")).toHaveTextContent("$300");
    expect(bars[1]?.parentElement?.querySelector("title")).toHaveTextContent("$0");
    expect(screen.getByTestId("exec-roi-trend-simulator-only")).toHaveTextContent("Rule-based analysis only");
    expect(screen.queryByTestId("exec-roi-trend-mixed-mode-footnote")).not.toBeInTheDocument();
  });
});
