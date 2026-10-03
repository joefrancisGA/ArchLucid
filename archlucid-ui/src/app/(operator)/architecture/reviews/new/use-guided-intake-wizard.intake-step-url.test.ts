import { renderHook, type ReactNode } from "@testing-library/react";
import { createElement, useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const intakeStepSearchParamsHarness = vi.hoisted(() => {
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

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    readWindowLocationSearch: () => intakeStepSearchParamsHarness.state.query,
    commitHrefIfChanged: (href: string, _options?: { readonly notify?: boolean }) => {
      intakeStepSearchParamsHarness.applyHref(href);

      return true;
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => intakeStepSearchParamsHarness.state.pathname,
  useSearchParams: () => new URLSearchParams(intakeStepSearchParamsHarness.state.query),
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
    freeTextIntent: "",
    businessOutcome: "",
    systemName: "",
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
    briefTextForAdmission: () => "",
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
    submitDraft: vi.fn(),
    workflowIntent: null,
    structuredBrief: null,
    answers: {},
    setAnswers: vi.fn(),
    draftId: null,
    setDraftId: vi.fn(),
    allClarificationsHandled: false,
    clarificationsPersistedForSubmit: false,
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

function IntakeStepSearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    intakeStepSearchParamsHarness.subscribe,
    () => intakeStepSearchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("useGuidedIntakeWizard intakeStep URL sync", () => {
  beforeEach(() => {
    intakeStepSearchParamsHarness.reset();
  });

  it("resets to step 0 when intakeStep= is cleared without a popstate event", () => {
    intakeStepSearchParamsHarness.state.query = "intakeStep=1";
    const { result, rerender } = renderHook(() => useGuidedIntakeWizard(), {
      wrapper: IntakeStepSearchParamsRerenderHost,
    });

    expect(result.current.step).toBe(1);

    intakeStepSearchParamsHarness.applyHref("/architecture/reviews/new");
    rerender();

    expect(result.current.step).toBe(0);
  });

  it("falls back to the nested architecture id when sourceArchitectureId is blank", () => {
    intakeStepSearchParamsHarness.state.pathname =
      "/architecture/architectures/architecture-123/reviews/new";
    intakeStepSearchParamsHarness.state.query = "sourceArchitectureId=%20";

    const { result } = renderHook(() => useGuidedIntakeWizard(), {
      wrapper: IntakeStepSearchParamsRerenderHost,
    });

    expect(result.current.sourceArchitectureId).toBe("architecture-123");
  });
});
