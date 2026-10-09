import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hydrateClarificationsFromDraft = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/new",
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    readWindowLocationSearch: () => "",
    commitHrefIfChanged: vi.fn(),
  };
});

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

type GuidedRestoreArgs = {
  readonly onRestore: (snapshot: { stepIndex: number; state: { draftId: string | null } }) => void;
};

let guidedRestoreArgs: GuidedRestoreArgs | null = null;

vi.mock("@/hooks/use-wizard-session-persistence", () => ({
  useWizardSessionPersistence: (args: GuidedRestoreArgs) => {
    guidedRestoreArgs = args;

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
    setAnswers: vi.fn(),
    draftId: null,
    setDraftId: vi.fn(),
    allClarificationsHandled: false,
    clarificationsPersistedForSubmit: false,
    hydrateClarificationsFromDraft,
  }),
}));

vi.mock("./use-guided-intake-clarification-inference", () => ({
  useGuidedIntakeClarificationInference: () => ({}),
}));

vi.mock("./use-guided-intake-prior-run-prefill", () => ({
  useGuidedIntakePriorRunPrefill: () => {},
}));

import { useGuidedIntakeWizard } from "./use-guided-intake-wizard";

describe("useGuidedIntakeWizard session restore", () => {
  beforeEach(() => {
    guidedRestoreArgs = null;
    hydrateClarificationsFromDraft.mockClear();
  });

  it("rewinds restored confirm bookmarks to clarifications when draftId is present", async () => {
    const { result } = renderHook(() => useGuidedIntakeWizard());

    act(() => {
      guidedRestoreArgs?.onRestore({
        stepIndex: 2,
        state: {
          draftId: "draft-confirm-bookmark",
          freeTextIntent: "",
          businessOutcome: "",
          systemName: "",
          actorSet: { actors: [] },
          answers: {},
        },
      });
    });

    await waitFor(() => {
      expect(result.current.step).toBe(1);
    });

    expect(hydrateClarificationsFromDraft).toHaveBeenCalledWith("draft-confirm-bookmark");
  });
});
