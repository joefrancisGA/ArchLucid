import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchParamsState = {
  value: new URLSearchParams(),
};

const { createArchitectureRunMock, saveTenantReviewCycleBaselineMock } = vi.hoisted(() => ({
  createArchitectureRunMock: vi.fn(),
  saveTenantReviewCycleBaselineMock: vi.fn(),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useSearchParams: () => searchParamsState.value,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  usePathname: () => "",
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

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

vi.mock("@/lib/save-tenant-review-cycle-baseline", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/save-tenant-review-cycle-baseline")>();

  return {
    ...actual,
    saveTenantReviewCycleBaseline: (...args: unknown[]) => saveTenantReviewCycleBaselineMock(...args),
  };
});

import { NewRunWizardClient } from "./NewRunWizardClient";
import { optIntoAdvancedNewRunWizardConfiguration } from "./new-run-wizard-test-helpers";

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

    await optIntoAdvancedNewRunWizardConfiguration();

    fireEvent.click(screen.getByRole("button", { name: /All steps/i }));

    await waitFor(() => {
      expect(screen.getByTestId("wizard-start-blank")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("wizard-start-blank"));

    await waitFor(() => {
      expect(screen.getByTestId("wizard-evidence-upload-step")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("wizard-evidence-source-demo"));
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

  it("renders the required baseline metrics step after advanced inputs", async () => {
    await advanceToBaselineMetricsStep();

    expect(screen.getByTestId("wizard-baseline-review-cycle-hours")).toBeRequired();
  });

  it("blocks advance when baseline hours are missing and tenant has no saved baseline", async () => {
    saveTenantReviewCycleBaselineMock.mockResolvedValue({ ok: true });

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

        if (url.includes("/v1/tenant/baseline")) {
          return {
            ok: true,
            json: async () => ({ baselineReviewCycleHours: null }),
          };
        }

        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );

    await advanceToBaselineMetricsStep();

    await clickPrimaryForward();

    await waitFor(() => {
      expect(screen.getByTestId("wizard-baseline-metrics-error")).toHaveTextContent(
        /Enter how many hours a typical architecture review takes/i,
      );
    });

    expect(saveTenantReviewCycleBaselineMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Review & submit" })).not.toBeInTheDocument();

    vi.unstubAllGlobals();
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
