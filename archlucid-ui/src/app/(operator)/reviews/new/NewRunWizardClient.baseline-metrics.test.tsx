import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchParamsState = {
  value: new URLSearchParams(),
};

const { createArchitectureRunMock, saveTenantReviewCycleBaselineMock } = vi.hoisted(() => ({
  createArchitectureRunMock: vi.fn(),
  saveTenantReviewCycleBaselineMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsState.value,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: import("react").ReactNode;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api", () => ({
  createArchitectureRun: (...args: unknown[]) => createArchitectureRunMock(...args),
  getRunSummary: vi.fn(),
  listRunsByProjectPaged: vi.fn().mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 50,
    hasMore: false,
  }),
}));

vi.mock("@/lib/save-tenant-review-cycle-baseline", () => ({
  saveTenantReviewCycleBaseline: (...args: unknown[]) => saveTenantReviewCycleBaselineMock(...args),
  validateWizardBaselineReviewCycleHours: (raw: string) => {
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
      return null;
    }

    const value = Number(trimmed);

    if (!Number.isFinite(value) || value <= 0) {
      return "Review cycle time must be a positive number.";
    }

    return null;
  },
}));

import { NewRunWizardClient } from "./NewRunWizardClient";

const WIZARD_MODE_STORAGE_KEY = "archlucid_new_run_wizard_mode_v1";

describe("NewRunWizardClient (baseline metrics step)", { timeout: 60_000 }, () => {
  beforeEach(() => {
    searchParamsState.value = new URLSearchParams();
    window.localStorage.setItem(WIZARD_MODE_STORAGE_KEY, "full");
    createArchitectureRunMock.mockReset();
    saveTenantReviewCycleBaselineMock.mockReset();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

        if (url.includes("/v1/agent-execution/cost-preview")) {
          return {
            ok: true,
            json: async () => ({
              mode: "Simulator",
              maxCompletionTokens: 4096,
              estimatedCostUsd: null,
              estimatedCostUsdLow: null,
              estimatedCostUsdHigh: null,
              estimatedCostBasis: "Simulator",
              pricingUsesIllustrativeUsdRates: true,
              deploymentName: null,
            }),
          };
        }

        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );
  });

  async function clickPrimaryForward(): Promise<void> {
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^(Continue|Next)$/ }));
    });
  }

  async function advanceToBaselineMetricsStep(): Promise<void> {
    render(<NewRunWizardClient />);

    await waitFor(() => {
      expect(screen.getByTestId("new-run-wizard-mode-toggle")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Full Wizard/i }));

    await waitFor(() => {
      expect(screen.getByTestId("wizard-start-blank")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("wizard-start-blank"));

    await waitFor(() => {
      expect(screen.getByTestId("wizard-evidence-upload-step")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("wizard-evidence-upload-skip-demo"));

    await waitFor(() => {
      expect(screen.getByLabelText("System name")).toBeInTheDocument();
    });

    for (let i = 0; i < 4; i += 1) {
      await clickPrimaryForward();
    }

    await waitFor(() => {
      expect(screen.getByTestId("wizard-baseline-metrics-step")).toBeInTheDocument();
    });
  }

  it("renders the optional baseline metrics step after advanced inputs", async () => {
    await advanceToBaselineMetricsStep();

    expect(screen.getByTestId("wizard-baseline-review-cycle-hours")).toBeInTheDocument();
  });

  it("advances without API call when skip for now is selected", async () => {
    await advanceToBaselineMetricsStep();

    fireEvent.click(screen.getByTestId("wizard-baseline-metrics-skip"));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Review & submit" })).toBeInTheDocument();
    });

    expect(saveTenantReviewCycleBaselineMock).not.toHaveBeenCalled();
  });

  it("persists baseline hours when Next is clicked with valid input", async () => {
    await advanceToBaselineMetricsStep();

    saveTenantReviewCycleBaselineMock.mockResolvedValue({ ok: true });

    fireEvent.change(screen.getByTestId("wizard-baseline-review-cycle-hours"), {
      target: { value: "40" },
    });
    fireEvent.change(screen.getByTestId("wizard-baseline-confidence"), {
      target: { value: "measured" },
    });

    await clickPrimaryForward();

    await waitFor(() => {
      expect(saveTenantReviewCycleBaselineMock).toHaveBeenCalledWith({
        baselineReviewCycleHours: 40,
        baselineReviewCycleSourceNote: "wizard: Very confident (measured)",
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Review & submit" })).toBeInTheDocument();
    });
  });
});
