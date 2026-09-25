import { renderHook, act, waitFor, type ReactNode } from "@testing-library/react";
import { createElement, useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ScopeUnderstandingBullet } from "@/lib/architecture/architecture-scope-understanding-check";

const scopeGateSearchParamsHarness = vi.hoisted(() => {
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

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    readWindowLocationSearch: () => scopeGateSearchParamsHarness.state.query,
    commitHrefIfChanged: (href: string, _options?: { readonly notify?: boolean }) => {
      scopeGateSearchParamsHarness.applyHref(href);

      return true;
    },
  };
});

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => "/architecture/reviews/new",
  useSearchParams: () => new URLSearchParams(scopeGateSearchParamsHarness.state.query),
}));

function ScopeGateSearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    scopeGateSearchParamsHarness.subscribe,
    () => scopeGateSearchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

vi.mock("@/hooks/use-llm-monthly-budget-execution-gate", () => ({
  useLlmMonthlyBudgetExecutionGate: () => ({ status: "ok", blocksLlmExecution: false }),
}));

vi.mock("@/hooks/use-agent-execution-mode", () => ({
  useAgentExecutionMode: () => ({ isSimulator: true }),
}));

vi.mock("@/hooks/use-inferred-universal-intake-answers", () => ({
  useInferredUniversalIntakeAnswers: () => ({
    inferredQuestionKeys: new Set<string>(),
    rephrasedQuestionKeys: new Set<string>(),
    isExtractingEvidenceText: false,
    clarificationSuggestionsUnavailable: false,
    canSuggestFromEvidence: false,
    suggestAnswersFromEvidence: vi.fn(),
    markQuestionEdited: vi.fn(),
    evidenceExtractionProgress: null,
  }),
}));

vi.mock("@/hooks/use-reviews-new-suppress-wizard-resume-prompt", () => ({
  useReviewsNewSuppressWizardResumePrompt: () => false,
}));

vi.mock("@/hooks/use-review-creation-progress", () => ({
  useReviewCreationProgress: () => ({ isActive: false }),
}));

vi.mock("@/hooks/use-workspace-system-name-availability", () => ({
  useWorkspaceSystemNameAvailability: () => ({
    blocksSubmit: false,
    validating: false,
  }),
}));

const useRunSummaryQuery = vi.fn(() => ({ data: undefined }));

vi.mock("@/hooks/use-run-summary-query", () => ({
  useRunSummaryQuery: (...args: unknown[]) => useRunSummaryQuery(...args),
}));

vi.mock("./use-first-pilot-intake-submit", () => ({
  useFirstPilotIntakeSubmit: () => ({
    clientValidationMessage: null,
    setClientValidationMessage: vi.fn(),
    submitRun: vi.fn(),
    recheckUnresolvedRun: vi.fn(),
  }),
}));

type CapturedPersistenceArgs = {
  readonly state: {
    readonly scopeGateOpen?: boolean;
    readonly scopeBullets?: readonly ScopeUnderstandingBullet[];
    readonly runTitle: string;
    readonly briefText: string;
  };
  readonly onRestore: (snapshot: { state: CapturedPersistenceArgs["state"] }) => void;
};

let capturedPersistence: CapturedPersistenceArgs | null = null;

vi.mock("@/hooks/use-wizard-session-persistence", () => ({
  useWizardSessionPersistence: (args: CapturedPersistenceArgs) => {
    capturedPersistence = args;

    return {
      saveState: "idle",
      lastSavedUtc: null,
      pendingRestore: null,
      acceptRestore: vi.fn(),
      dismissRestore: vi.fn(),
      clearSession: vi.fn(),
    };
  },
}));

import { mergeScopeBulletsIntoBrief } from "@/lib/architecture/architecture-scope-understanding-check";

import { useFirstPilotIntakeWizard } from "./use-first-pilot-intake-wizard";

const sampleScopeBullets: ScopeUnderstandingBullet[] = [
  {
    id: "scope-1",
    kind: "system",
    label: "Primary System or Architecture",
    value: "Retail API",
    source: "inferred",
  },
];

describe("useFirstPilotIntakeWizard prior-run prefill", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    capturedPersistence = null;
    scopeGateSearchParamsHarness.reset();
    useRunSummaryQuery.mockReturnValue({ data: undefined });
  });

  it("does not prefill the run title from orphan rerun= without revised-clone intent", async () => {
    scopeGateSearchParamsHarness.state.query = "rerun=run-guided-only";
    useRunSummaryQuery.mockReturnValue({
      data: { displayName: "Inherited guided rerun title", description: null },
    });

    const { result } = renderHook(() => useFirstPilotIntakeWizard({}));

    await waitFor(() => {
      expect(useRunSummaryQuery).toHaveBeenCalled();
    });

    expect(result.current.runTitle).toBe("");
    expect(result.current.inheritedPriorTitle).toBeNull();
  });

  it("prefills the run title when revised-clone intent carries rerun=", async () => {
    scopeGateSearchParamsHarness.state.query =
      "intent=revised-clone&rerun=run-second-review&priorRunId=run-second-review";
    useRunSummaryQuery.mockReturnValue({
      data: { displayName: "Second review inherited title", description: null },
    });

    const { result } = renderHook(() => useFirstPilotIntakeWizard({}));

    await waitFor(() => {
      expect(result.current.runTitle).toBe("Second review inherited title");
    });

    expect(result.current.inheritedPriorTitle).toBe("Second review inherited title");
  });
});

describe("useFirstPilotIntakeWizard scope gate URL sync", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    capturedPersistence = null;
    scopeGateSearchParamsHarness.reset();
    useRunSummaryQuery.mockReturnValue({ data: undefined });
  });

  it("follows scopeGate= URL changes without a popstate event", () => {
    scopeGateSearchParamsHarness.state.query = "scopeGate=1";

    const { result, rerender } = renderHook(() => useFirstPilotIntakeWizard({}), {
      wrapper: ScopeGateSearchParamsRerenderHost,
    });

    expect(result.current.scopeGateOpen).toBe(true);

    scopeGateSearchParamsHarness.applyHref("/architecture/reviews/new");
    rerender();

    expect(result.current.scopeGateOpen).toBe(false);
  });
});

describe("useFirstPilotIntakeWizard session restore", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    capturedPersistence = null;
    scopeGateSearchParamsHarness.state.query = "scopeGate=1";
    useRunSummaryQuery.mockReturnValue({ data: undefined });
  });

  it("persists scope gate and bullets in the quick-start session snapshot", async () => {
    const { result } = renderHook(() => useFirstPilotIntakeWizard({}));

    act(() => {
      result.current.setScopeGateOpen(true);
      result.current.setScopeBullets(sampleScopeBullets);
      result.current.setRunTitle("Retail API modernization review");
      result.current.setBriefText("Modernize the retail API platform.");
    });

    await waitFor(() => {
      expect(capturedPersistence?.state.scopeGateOpen).toBe(true);
    });

    expect(capturedPersistence?.state.scopeBullets).toEqual(sampleScopeBullets);
  });

  it("restores scope gate and bullets from session so submit keeps merged scope", async () => {
    const { result } = renderHook(() => useFirstPilotIntakeWizard({}));

    act(() => {
      capturedPersistence?.onRestore({
        state: {
          runTitle: "Retail API modernization review",
          briefText: "Modernize the retail API platform.",
          focusedPilotModeEnabled: true,
          l0Answers: {},
          l0SkippedQuestionKeys: [],
          scopeGateOpen: true,
          scopeBullets: sampleScopeBullets,
        },
      });
    });

    await waitFor(() => {
      expect(result.current.scopeGateOpen).toBe(true);
    });

    expect(result.current.scopeBullets).toEqual(sampleScopeBullets);

    const mergedBrief = mergeScopeBulletsIntoBrief(
      result.current.scopeBullets,
      "Modernize the retail API platform.",
    );

    expect(mergedBrief).toContain("Retail API");
  });
});
