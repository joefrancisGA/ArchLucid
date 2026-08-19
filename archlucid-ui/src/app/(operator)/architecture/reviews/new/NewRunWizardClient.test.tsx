import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createArchitectureRunMock, getRunSummaryMock } = vi.hoisted(() => ({
  createArchitectureRunMock: vi.fn(),
  getRunSummaryMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  usePathname: () => "",
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/api", () => ({
  createArchitectureRun: (...args: unknown[]) => createArchitectureRunMock(...args),
  getRunSummary: (...args: unknown[]) => getRunSummaryMock(...args),
  listRunsByProjectPaged: vi.fn().mockResolvedValue({
    items: [
      {
        runId: "prior-run",
        projectId: "default",
        createdUtc: "2026-01-01T00:00:00.000Z",
        hasGoldenManifest: true,
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 50,
    hasMore: false,
  }),
}));

import { NewRunWizardClient } from "./NewRunWizardClient";
import { optIntoAdvancedNewRunWizardConfiguration } from "./new-run-wizard-test-helpers";
import { buildWizardSessionStorageKey, WIZARD_SESSION_IDS } from "@/lib/wizard-session-persistence";

const WIZARD_MODE_STORAGE_KEY = "archlucid_new_run_wizard_mode_v1";

function greenfieldPresetCard(): HTMLElement {
  const useGreenfield = screen.getByRole("button", { name: "Use greenfield web app" });

  return useGreenfield.closest('[class*="rounded-xl"]') as HTMLElement;
}

function progressLine(): HTMLElement {
  return screen.getByTestId("new-run-wizard-step-line");
}

async function renderNewRunWizard() {
  window.localStorage.setItem(WIZARD_MODE_STORAGE_KEY, "full");
  render(<NewRunWizardClient />);

  await waitFor(
    () => {
      expect(screen.queryByText("Loading wizard…")).not.toBeInTheDocument();
    },
    { timeout: 15_000 },
  );

  const allStepsButton = screen.queryByRole("button", { name: /All steps \(\d+\)/ });

  if (allStepsButton === null) {
    await optIntoAdvancedNewRunWizardConfiguration();
  }

  await waitFor(
    () => {
      expect(screen.getByRole("button", { name: /All steps \(\d+\)/ })).toBeInTheDocument();
    },
    { timeout: 15_000 },
  );

  const fullModeButton = screen.getByRole("button", { name: /All steps \(\d+\)/ });

  if (fullModeButton.getAttribute("aria-pressed") !== "true") {
    await act(async () => {
      fireEvent.click(fullModeButton);
    });
  }

  await waitFor(
    () => {
      expect(screen.getByTestId("new-run-wizard-progress")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /All steps \(\d+\)/ })).toHaveAttribute("aria-pressed", "true");
    },
    { timeout: 15_000 },
  );

  await waitFor(
    () => {
      expect(screen.getByTestId("new-run-wizard-step-line")).toHaveTextContent(/Step 1: Choose starting point/);
    },
    { timeout: 15_000 },
  );
}

async function clickPrimaryForward() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /^(Continue|Next)$/ }));
  });
}

async function skipEvidenceStep() {
  await waitFor(() => {
    expect(screen.getByTestId("wizard-evidence-upload-step")).toBeInTheDocument();
  });

  await act(async () => {
    fireEvent.click(screen.getByTestId("wizard-evidence-brief-continue"));
  });
}

async function selectGreenfieldPreset() {
  const greenfieldCard = greenfieldPresetCard();

  await act(async () => {
    fireEvent.click(within(greenfieldCard).getByRole("button", { name: "Use greenfield web app" }));
  });

  await waitFor(() => {
    expect(progressLine()).toHaveTextContent(/Step 2: Evidence \(optional\)/);
  });
}

async function selectGreenfieldAndSkipEvidence() {
  await selectGreenfieldPreset();
  await skipEvidenceStep();

  await waitFor(() => {
    expect(progressLine()).toHaveTextContent(/Step 3: Identity & goals/);
  });
}

describe("NewRunWizardClient", { timeout: 60_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.removeItem(WIZARD_MODE_STORAGE_KEY);
    window.sessionStorage.removeItem(buildWizardSessionStorageKey(WIZARD_SESSION_IDS.reviewsNewTemplates));
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
              estimatedCostBasis:
                "Starter run = 4 parallel agents (Topology, Cost, Compliance, Critic). Low = one completion at 8192 assumed input tokens.",
              pricingUsesIllustrativeUsdRates: true,
              deploymentName: null,
            }),
          };
        }

        if (url.includes("/v1/tenant/baseline")) {
          return {
            ok: true,
            json: async () => ({ baselineReviewCycleHours: 40 }),
          };
        }

        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );
    createArchitectureRunMock.mockResolvedValue({ run: { runId: "integration-run-1" } });
    getRunSummaryMock.mockResolvedValue({
      runId: "integration-run-1",
      projectId: "default",
      createdUtc: "2026-01-01T00:00:00.000Z",
      hasContextSnapshot: true,
      hasGraphSnapshot: true,
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    });
  });

  it(
    "walks preset → review, creates a run, lands on pipeline tracking with polling",
    async () => {
    await renderNewRunWizard();

    expect(progressLine()).toHaveTextContent(/Step 1: Choose starting point/);
    expect(screen.getByTestId("new-run-wizard-stage-line")).toHaveTextContent(/Stage 1 of 4 — Request brief/);

    await selectGreenfieldPreset();
    await skipEvidenceStep();

    for (let i = 0; i < 5; i += 1) {
      await clickPrimaryForward();
    }

    expect(progressLine()).toHaveTextContent(/Step 8: Review/);
    expect(screen.getByRole("heading", { name: "Review & submit" })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Start Architecture Review" }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await waitFor(() => {
      expect(createArchitectureRunMock).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(screen.getByRole("heading", { name: "Track review progress" })).toBeInTheDocument();
      },
      { timeout: 15_000 },
    );

    await waitFor(() => {
      expect(getRunSummaryMock).toHaveBeenCalledWith("integration-run-1");
    });
    },
    60_000,
  );

  it("navigates backward when Back is pressed", async () => {
    await renderNewRunWizard();

    await clickPrimaryForward();
    expect(progressLine()).toHaveTextContent(/Step 2: Evidence \(optional\)/);

    await clickPrimaryForward();
    expect(progressLine()).toHaveTextContent(/Step 3: Identity & goals/);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(progressLine()).toHaveTextContent(/Step 2: Evidence \(optional\)/);
  });

  it("blocks Next and shows an inline system name error when required field is empty", async () => {
    await renderNewRunWizard();

    await selectGreenfieldAndSkipEvidence();

    const systemName = screen.getByLabelText("System name");
    fireEvent.change(systemName, { target: { value: "" } });
    fireEvent.blur(systemName);

    await clickPrimaryForward();

    expect(progressLine()).toHaveTextContent(/Step 3: Identity & goals/);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Required/i);
  });

  it("clears the system name error when the user types", async () => {
    await renderNewRunWizard();

    await selectGreenfieldAndSkipEvidence();

    const systemName = screen.getByLabelText("System name");
    fireEvent.change(systemName, { target: { value: "" } });
    fireEvent.blur(systemName);
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    fireEvent.change(systemName, { target: { value: "Ab" } });
    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  it("advances from identity when fields satisfy validation", async () => {
    await renderNewRunWizard();

    await selectGreenfieldAndSkipEvidence();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    expect(progressLine()).toHaveTextContent(/Step 4: Constraints/);
  });

  it("blocks Next on identity when prior manifest version is not a valid UUID", async () => {
    await renderNewRunWizard();

    await selectGreenfieldAndSkipEvidence();

    const advancedTriggers = screen.getAllByRole("button", { name: /advanced options/i });
    fireEvent.click(advancedTriggers[0]);

    const prior = screen.getByLabelText("Prior review record version (optional)");
    fireEvent.change(prior, {
      target: { value: "not-a-uuid" },
    });
    fireEvent.blur(prior);

    await clickPrimaryForward();

    expect(progressLine()).toHaveTextContent(/Step 3: Identity & goals/);
    expect(await screen.findByRole("alert")).toHaveTextContent(/valid uuid/i);
  });

  it("blocks Next on description when narrative is shorter than the minimum length", async () => {
    await renderNewRunWizard();

    await selectGreenfieldAndSkipEvidence();

    const description = screen.getByLabelText("Description");
    fireEvent.change(description, { target: { value: "short" } });
    fireEvent.blur(description);

    await clickPrimaryForward();

    expect(progressLine()).toHaveTextContent(/Step 3: Identity & goals/);
    expect(await screen.findByRole("alert")).toHaveTextContent(/at least 10 characters/i);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});
