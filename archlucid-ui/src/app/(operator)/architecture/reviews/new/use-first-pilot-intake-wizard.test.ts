import { renderHook, act, waitFor, type ReactNode } from "@testing-library/react";
import { createElement, useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ScopeUnderstandingBullet } from "@/lib/architecture/architecture-scope-understanding-check";

const scopeGateSearchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "", windowQuery: null as string | null };

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

      state.windowQuery = state.query;

      for (const listener of listeners) {
        listener();
      }
    },
    applySearchParamsQuery(query: string): void {
      state.query = query;

      for (const listener of listeners) {
        listener();
      }
    },
    setWindowLocationSearch(query: string): void {
      state.windowQuery = query;
    },
    readWindowLocationSearch(): string {
      return state.windowQuery ?? state.query;
    },
    reset(): void {
      state.query = "";
      state.windowQuery = null;
    },
  };
});

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    readWindowLocationSearch: () => scopeGateSearchParamsHarness.readWindowLocationSearch(),
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

const getPriorPackageSemanticCounts = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/draft-intake-api-crud", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/draft-intake-api-crud")>();

  return {
    ...actual,
    getPriorPackageSemanticCounts: (...args: unknown[]) => getPriorPackageSemanticCounts(...args),
  };
});

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

const sessionRestoreOnMountHarness = vi.hoisted(() => ({
  snapshot: null as CapturedPersistenceArgs["state"] | null,
}));

vi.mock("@/hooks/use-wizard-session-persistence", async () => {
  const React = await import("react");

  return {
    useWizardSessionPersistence: (args: CapturedPersistenceArgs) => {
      capturedPersistence = args;

      React.useEffect(() => {
        const snapshot = sessionRestoreOnMountHarness.snapshot;

        if (snapshot !== null) {
          args.onRestore({ state: snapshot });
        }
      }, []);

      return {
        saveState: "idle",
        lastSavedUtc: null,
        pendingRestore: null,
        acceptRestore: vi.fn(),
        dismissRestore: vi.fn(),
        clearSession: vi.fn(),
      };
    },
  };
});

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
    sessionRestoreOnMountHarness.snapshot = null;
    scopeGateSearchParamsHarness.reset();
    useRunSummaryQuery.mockReturnValue({ data: undefined });
    getPriorPackageSemanticCounts.mockReset();
    getPriorPackageSemanticCounts.mockResolvedValue(null);
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

  it("ignores stale prior-run semantic counts when rerun= changes before the first fetch resolves", async () => {
    let resolveFirstCounts!: (value: {
      actorCount: number;
      assumptionCount: number;
      decisionCount: number;
      requirementCount: number;
    }) => void;
    const firstCountsPromise = new Promise<{
      actorCount: number;
      assumptionCount: number;
      decisionCount: number;
      requirementCount: number;
    }>((resolve) => {
      resolveFirstCounts = resolve;
    });

    getPriorPackageSemanticCounts.mockImplementation((runId: string) => {
      if (runId === "run-first") {
        return firstCountsPromise;
      }

      if (runId === "run-second") {
        return Promise.resolve({
          actorCount: 9,
          assumptionCount: 0,
          decisionCount: 0,
          requirementCount: 0,
        });
      }

      return Promise.resolve(null);
    });

    scopeGateSearchParamsHarness.state.query =
      "intent=revised-clone&rerun=run-first&priorRunId=run-first";

    const { result, rerender } = renderHook(() => useFirstPilotIntakeWizard({}), {
      wrapper: ScopeGateSearchParamsRerenderHost,
    });

    scopeGateSearchParamsHarness.applyHref(
      "/architecture/reviews/new?intent=revised-clone&rerun=run-second&priorRunId=run-second",
    );
    rerender();

    await act(async () => {
      resolveFirstCounts({
        actorCount: 1,
        assumptionCount: 0,
        decisionCount: 0,
        requirementCount: 0,
      });
      await firstCountsPromise;
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.inheritedSemanticSummary).toContain("9 actors");
    });
  });

  it("clears inherited semantic summary immediately when rerun= changes after prior counts loaded", async () => {
    let resolveSecondCounts!: (value: {
      actorCount: number;
      assumptionCount: number;
      decisionCount: number;
      requirementCount: number;
    }) => void;
    const secondCountsPromise = new Promise<{
      actorCount: number;
      assumptionCount: number;
      decisionCount: number;
      requirementCount: number;
    }>((resolve) => {
      resolveSecondCounts = resolve;
    });

    getPriorPackageSemanticCounts.mockImplementation((runId: string) => {
      if (runId === "run-first") {
        return Promise.resolve({
          actorCount: 1,
          assumptionCount: 0,
          decisionCount: 0,
          requirementCount: 0,
        });
      }

      if (runId === "run-second") {
        return secondCountsPromise;
      }

      return Promise.resolve(null);
    });

    scopeGateSearchParamsHarness.state.query =
      "intent=revised-clone&rerun=run-first&priorRunId=run-first";

    const { result, rerender } = renderHook(() => useFirstPilotIntakeWizard({}), {
      wrapper: ScopeGateSearchParamsRerenderHost,
    });

    await waitFor(() => {
      expect(result.current.inheritedSemanticSummary).toContain("1 actor");
    });

    scopeGateSearchParamsHarness.applyHref(
      "/architecture/reviews/new?intent=revised-clone&rerun=run-second&priorRunId=run-second",
    );
    rerender();

    expect(result.current.inheritedSemanticSummary).toBeNull();

    await act(async () => {
      resolveSecondCounts({
        actorCount: 4,
        assumptionCount: 0,
        decisionCount: 0,
        requirementCount: 0,
      });
      await secondCountsPromise;
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.inheritedSemanticSummary).toContain("4 actors");
    });
  });

  it("clears inherited semantic summary when revised-clone intent is removed after counts load", async () => {
    getPriorPackageSemanticCounts.mockResolvedValue({
      actorCount: 2,
      assumptionCount: 0,
      decisionCount: 1,
      requirementCount: 3,
    });

    scopeGateSearchParamsHarness.state.query =
      "intent=revised-clone&rerun=run-second-review&priorRunId=run-second-review";

    const { result, rerender } = renderHook(() => useFirstPilotIntakeWizard({}), {
      wrapper: ScopeGateSearchParamsRerenderHost,
    });

    await waitFor(() => {
      expect(result.current.inheritedSemanticSummary).not.toBeNull();
    });

    scopeGateSearchParamsHarness.applyHref("/architecture/reviews/new");
    rerender();

    expect(result.current.inheritedSemanticSummary).toBeNull();
  });

  it("prefills the run title when revised-clone intent carries rerun=", async () => {
    scopeGateSearchParamsHarness.state.query =
      "intent=revised-clone&rerun=run-second-review&priorRunId=run-second-review";
    useRunSummaryQuery.mockReturnValue({
      data: { displayName: "Second review inherited title", description: null },
      isFetched: true,
    });

    const { result } = renderHook(() => useFirstPilotIntakeWizard({}));

    await waitFor(() => {
      expect(result.current.runTitle).toBe("Second review inherited title");
    });

    expect(result.current.inheritedPriorTitle).toBe("Second review inherited title");
  });

  it("does not apply stale run summary data while the new prior run summary is still fetching", async () => {
    useRunSummaryQuery.mockImplementation((runId: string) => {
      if (runId === "run-second") {
        return {
          data: { displayName: "Wrong prior title", description: null },
          isFetching: true,
          isPending: true,
          isFetched: false,
        };
      }

      return { data: undefined, isFetching: false, isPending: false, isFetched: false };
    });

    scopeGateSearchParamsHarness.state.query =
      "intent=revised-clone&rerun=run-second&priorRunId=run-second";

    const { result } = renderHook(() => useFirstPilotIntakeWizard({}), {
      wrapper: ScopeGateSearchParamsRerenderHost,
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.runTitle).toBe("");
    expect(result.current.inheritedPriorTitle).toBeNull();
  });

  it("prefills the run title from the new prior run when rerun= changes after the first title loaded", async () => {
    useRunSummaryQuery.mockImplementation((runId: string) => {
      if (runId === "run-first") {
        return {
          data: { displayName: "First inherited title", description: null },
          isFetched: true,
        };
      }

      if (runId === "run-second") {
        return {
          data: { displayName: "Second inherited title", description: null },
          isFetched: true,
        };
      }

      return { data: undefined, isFetched: false };
    });

    scopeGateSearchParamsHarness.state.query =
      "intent=revised-clone&rerun=run-first&priorRunId=run-first";

    const { result, rerender } = renderHook(() => useFirstPilotIntakeWizard({}), {
      wrapper: ScopeGateSearchParamsRerenderHost,
    });

    await waitFor(() => {
      expect(result.current.runTitle).toBe("First inherited title");
    });

    scopeGateSearchParamsHarness.applyHref(
      "/architecture/reviews/new?intent=revised-clone&rerun=run-second&priorRunId=run-second",
    );
    rerender();

    await waitFor(() => {
      expect(result.current.runTitle).toBe("Second inherited title");
      expect(result.current.inheritedPriorTitle).toBe("Second inherited title");
    });
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

  it("clears stale scopeGate from the address bar when closing the gate after URL ref syncs before React state", () => {
    scopeGateSearchParamsHarness.applyHref("/architecture/reviews/new?scopeGate=1");

    const { result, rerender } = renderHook(() => useFirstPilotIntakeWizard({}), {
      wrapper: ScopeGateSearchParamsRerenderHost,
    });

    expect(result.current.scopeGateOpen).toBe(true);

    act(() => {
      scopeGateSearchParamsHarness.applySearchParamsQuery("");
      scopeGateSearchParamsHarness.setWindowLocationSearch("scopeGate=1");
      rerender();
      result.current.setScopeGateOpen(false);
    });

    const lastHref = scopeGateSearchParamsHarness.readWindowLocationSearch();
    expect(lastHref.includes("scopeGate=")).toBe(false);
    expect(result.current.scopeGateOpen).toBe(false);
  });
});

describe("useFirstPilotIntakeWizard session restore", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    capturedPersistence = null;
    sessionRestoreOnMountHarness.snapshot = null;
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

  it("keeps restored quick-start title when template= deeplink and session auto-restore run on the same mount", async () => {
    scopeGateSearchParamsHarness.state.query = "template=customer-intake-modernization";
    sessionRestoreOnMountHarness.snapshot = {
      runTitle: "Restored quick-start title",
      briefText: "Restored operator brief body.",
      focusedPilotModeEnabled: true,
      l0Answers: {},
      l0SkippedQuestionKeys: [],
      scopeGateOpen: false,
      scopeBullets: [],
    };

    const { result } = renderHook(() => useFirstPilotIntakeWizard({}));

    await waitFor(() => {
      expect(result.current.runTitle).toBe("Restored quick-start title");
    });

    expect(result.current.briefText).toBe("Restored operator brief body.");
    expect(result.current.runTitle).not.toBe("Enterprise customer intake");
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
