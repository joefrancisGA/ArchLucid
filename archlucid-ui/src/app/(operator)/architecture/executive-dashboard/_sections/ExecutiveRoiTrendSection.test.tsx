import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";

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

  it("shows mixed-mode footnote and simulator-only badge when history includes both modes", async () => {
    renderWithQueryClient(<ExecutiveRoiTrendSection defaultTimeRange="all" />);

    await waitFor(() => {
      expect(screen.getByTestId("exec-roi-trend-chart")).toBeInTheDocument();
    });

    expect(screen.getByTestId("exec-roi-trend-mixed-mode-footnote")).toHaveTextContent(
      /Chart includes both Real and Simulator runs/i,
    );
    expect(screen.getByTestId("exec-roi-trend-simulator-only")).toHaveTextContent("Simulator-only");
    expect(screen.getByTestId("exec-roi-trend-svg-chart")).toBeInTheDocument();
  });
});
