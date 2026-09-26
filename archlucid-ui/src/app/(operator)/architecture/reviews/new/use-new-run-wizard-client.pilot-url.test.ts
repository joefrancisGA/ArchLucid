import { render, waitFor, type ReactNode } from "@testing-library/react";
import { createElement, useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pilotSearchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "" };

  return {
    state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    applyHref(href: string): void {
      try {
        const url = new URL(href, "http://localhost/");
        state.query = url.search.startsWith("?") ? url.search.slice(1) : url.search;
      } catch {
        const qIndex = href.indexOf("?");
        state.query = qIndex >= 0 ? href.slice(qIndex + 1) : "";
      }

      for (const listener of listeners) {
        listener();
      }
    },
    reset(): void {
      state.query = "";
    },
  };
});

const focusedPilotModeEnabledRef = vi.hoisted(() => ({ current: true }));

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    readWindowLocationSearch: () => pilotSearchParamsHarness.state.query,
    commitHrefIfChanged: (href: string, _options?: { readonly notify?: boolean }) => {
      pilotSearchParamsHarness.applyHref(href);

      return true;
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/new",
  useSearchParams: () => new URLSearchParams(pilotSearchParamsHarness.state.query),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/use-core-pilot-commit-presentation-context", () => ({
  useCorePilotCommitPresentationContext: () => ({
    hasCommittedManifest: true,
    latestCommittedRunId: null,
    latestRunId: null,
  }),
}));

vi.mock("@/hooks/use-new-run-wizard-committed-probe-query", () => ({
  useNewRunWizardCommittedProbeQuery: () => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    data: { hasCommittedManifest: true },
  }),
}));

vi.mock("./use-new-run-wizard-intake-params", () => ({
  useNewRunWizardIntakeParams: () => ({
    baselineFirst: false,
    exampleTemplate: null,
    featuredSampleRunId: null,
    followUpSourceRunId: null,
    presetDeeplinkPresetId: null,
    presetDeeplinkToken: null,
  }),
}));

vi.mock("./use-new-run-wizard-llm-budget-gate", () => ({
  useNewRunWizardLlmBudgetGate: () => ({ status: null, blocksLlmExecution: false }),
}));

vi.mock("./use-new-run-wizard-baseline-metrics", () => ({
  useNewRunWizardBaselineMetrics: () => ({
    baselineReviewCycleHours: "",
    setBaselineReviewCycleHours: vi.fn(),
    baselineConfidence: "",
    setBaselineConfidence: vi.fn(),
    baselineMetricsError: null,
    setBaselineMetricsError: vi.fn(),
    persistBaselineMetricsIfNeeded: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock("./use-new-run-wizard-pending-evidence", () => ({
  useNewRunWizardPendingEvidence: () => ({
    hasPendingEvidence: false,
    handlePendingEvidenceFileChange: vi.fn(),
  }),
}));

vi.mock("./use-new-run-wizard-track-stream", () => ({
  useNewRunWizardTrackStream: () => ({
    pollSummary: null,
    liveMessage: "",
    retryTrackPolling: vi.fn(),
  }),
}));

vi.mock("./use-new-run-wizard-query-prefill", () => ({
  useNewRunWizardQueryPrefill: vi.fn(),
}));

vi.mock("./use-new-run-wizard-submit", () => ({
  useNewRunWizardSubmit: () => ({
    submitRun: vi.fn(),
    submitError: null,
    isCreating: false,
    creationProgress: { phase: "idle" },
    recheckUnresolvedRun: vi.fn(),
  }),
}));

vi.mock("./NewRunWizardTemplateRestore", () => ({
  useNewRunWizardTemplateRestore: () => ({
    templateWizardSession: { saveState: "idle" },
    suppressWizardResumePrompt: false,
    saveWizardDraft: vi.fn(),
    clearDraftSaveFeedback: vi.fn(),
  }),
}));

vi.mock("./NewRunWizardDeferredChunks", () => ({
  WizardPostCreateEvidenceUploadPanel: () => null,
  WizardStepTrack: () => null,
}));

vi.mock("./NewRunWizardStepBody", () => ({
  NewRunWizardStepBody: (props: { readonly focusedPilotModeEnabled: boolean }) => {
    focusedPilotModeEnabledRef.current = props.focusedPilotModeEnabled;

    return null;
  },
}));

vi.mock("./use-new-run-wizard-steps", () => ({
  useNewRunWizardSteps: () => ({
    stepIndex: 0,
    setStepIndex: vi.fn(),
    goBack: vi.fn(),
    goToStep: vi.fn(),
    goNext: vi.fn(),
    advance: vi.fn(),
    isFirstStep: true,
    isReviewStep: false,
    showNav: true,
    macroStep: 0,
    completedMacroSteps: [],
    wizardCompleteSetupSteps: [],
    wizardCompleteSetupEmphasizedStepId: null,
    showStepRecap: false,
    showDetailedPathStepperChrome: false,
    showSimplifiedPilotWizard: false,
    showQuickStartWizard: false,
    effectiveShowFullWizardShell: true,
    stepDefinitions: [{ label: "Identity", description: "" }],
    showQuickTrack: false,
  }),
}));

import { useNewRunWizardClient } from "./use-new-run-wizard-client";

function PilotSearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    pilotSearchParamsHarness.subscribe,
    () => pilotSearchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

function NewRunWizardClientPilotProbe() {
  const { stepBody } = useNewRunWizardClient({ embeddedInPathSwitcher: true });

  return stepBody;
}

describe("useNewRunWizardClient pilot URL sync", () => {
  beforeEach(() => {
    pilotSearchParamsHarness.reset();
    window.localStorage.clear();
    focusedPilotModeEnabledRef.current = true;
  });

  it("re-enables focused pilot mode when pilot= is cleared without a popstate event", async () => {
    pilotSearchParamsHarness.state.query = "mode=full&pilot=0";

    const view = render(
      createElement(
        PilotSearchParamsRerenderHost,
        null,
        createElement(NewRunWizardClientPilotProbe),
      ),
    );

    await waitFor(() => {
      expect(focusedPilotModeEnabledRef.current).toBe(false);
    });

    pilotSearchParamsHarness.applyHref("/architecture/reviews/new?mode=full");
    view.rerender(
      createElement(
        PilotSearchParamsRerenderHost,
        null,
        createElement(NewRunWizardClientPilotProbe),
      ),
    );

    await waitFor(() => {
      expect(focusedPilotModeEnabledRef.current).toBe(true);
    });
  });
});
