import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ScopeUnderstandingBullet } from "@/lib/architecture/architecture-scope-understanding-check";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => "/architecture/reviews/new",
  useSearchParams: () => new URLSearchParams("scopeGate=1"),
}));

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

vi.mock("@/hooks/use-run-summary-query", () => ({
  useRunSummaryQuery: () => ({ data: undefined }),
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

describe("useFirstPilotIntakeWizard session restore", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    capturedPersistence = null;
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
