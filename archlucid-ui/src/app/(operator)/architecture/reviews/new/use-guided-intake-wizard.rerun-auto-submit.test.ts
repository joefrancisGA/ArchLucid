import { renderHook, waitFor, type ReactNode } from "@testing-library/react";
import { createElement, useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { pathname: "/architecture/reviews/new", query: "" };

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
      state.pathname = "/architecture/reviews/new";
      state.query = "";
    },
  };
});

const submitDraft = vi.hoisted(() => vi.fn());

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    readWindowLocationSearch: () => searchParamsHarness.state.query,
    commitHrefIfChanged: (href: string, _options?: { readonly notify?: boolean }) => {
      searchParamsHarness.applyHref(href);

      return true;
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => searchParamsHarness.state.pathname,
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/hooks/use-llm-monthly-budget-execution-gate", () => ({
  useLlmMonthlyBudgetExecutionGate: () => ({ status: null, blocksLlmExecution: false }),
}));

vi.mock("@/hooks/use-workspace-system-name-availability", () => ({
  useWorkspaceSystemNameAvailability: () => ({
    status: "idle",
    blocksSubmit: false,
    validating: false,
  }),
}));

vi.mock("@/hooks/use-wizard-session-persistence", () => ({
  useWizardSessionPersistence: () => ({
    save: vi.fn(),
    restore: vi.fn(),
    clearSession: vi.fn(),
  }),
}));

vi.mock("./use-guided-intake-brief-form", () => ({
  useGuidedIntakeBriefForm: () => ({
    focusedPilotModeEnabled: true,
    scopeGateOpen: false,
    scopeBullets: [],
    scopeConfirmed: false,
    freeTextIntent: "Intent with enough detail for guided intake admission.",
    businessOutcome: "Reduce triage time.",
    systemName: "PartnerApiPlatform",
    actorSet: { actors: [] },
    evidenceFiles: [],
    priorAttachedFileNames: [],
    setFreeTextIntent: vi.fn(),
    setBusinessOutcome: vi.fn(),
    setSystemName: vi.fn(),
    setActorSet: vi.fn(),
    setFocusedPilotModeEnabled: vi.fn(),
    setScopeBullets: vi.fn(),
    setScopeGateOpen: vi.fn(),
    setEvidenceFiles: vi.fn(),
    setPriorAttachedFileNames: vi.fn(),
    advanceBlockers: [],
    mergeScopeIntoBrief: vi.fn(),
    applyExampleTemplate: vi.fn(),
    briefTextForAdmission: () => "Intent with enough detail for guided intake admission.",
  }),
}));

vi.mock("./use-guided-intake-draft-workflow", () => ({
  useGuidedIntakeDraftWorkflow: () => ({
    answers: {},
    pendingQuestions: [],
    busy: false,
    sourceArchitectureAccessBlocked: false,
    viewAllClarifications: false,
    setViewAllClarifications: vi.fn(),
    clarificationSelectionHydrated: true,
    linkedSpawnedRunId: null,
    isSubmitBlocked: false,
    admitDraft: vi.fn(),
    refreshQuestions: vi.fn(),
    submitDraft,
    workflowIntent: null,
    structuredBrief: null,
    setAnswers: vi.fn(),
    draftId: "draft-rerun-1",
    setDraftId: vi.fn(),
    allClarificationsHandled: true,
    clarificationsPersistedForSubmit: true,
    hydrateClarificationsFromDraft: vi.fn(),
  }),
}));

vi.mock("./use-guided-intake-clarification-inference", () => ({
  useGuidedIntakeClarificationInference: () => ({}),
}));

vi.mock("./use-guided-intake-prior-run-prefill", () => ({
  useGuidedIntakePriorRunPrefill: () => {},
}));

import { useGuidedIntakeWizard } from "./use-guided-intake-wizard";

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("useGuidedIntakeWizard rerun auto-submit", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    submitDraft.mockClear();
  });

  it("auto-submits again when priorRunId changes without remounting the wizard", async () => {
    searchParamsHarness.state.query = "priorRunId=run-first&intakeStep=2";

    const { rerender } = renderHook(() => useGuidedIntakeWizard(), {
      wrapper: SearchParamsRerenderHost,
    });

    await waitFor(() => {
      expect(submitDraft).toHaveBeenCalledTimes(1);
    });

    searchParamsHarness.applyHref(
      "/architecture/reviews/new?priorRunId=run-second&intakeStep=2",
    );
    rerender();

    await waitFor(() => {
      expect(submitDraft).toHaveBeenCalledTimes(2);
    });
  });
});
