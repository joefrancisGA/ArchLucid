import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { getDraftRequest, getDraftQuestions, initializeArchitectureCreation } = vi.hoisted(() => ({
  getDraftRequest: vi.fn(),
  getDraftQuestions: vi.fn(),
  initializeArchitectureCreation: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/new",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: false }),
}));

vi.mock("@/lib/api/draft-intake-api", () => ({
  createDraftRequest: vi.fn(),
  getDraftQuestions,
  getDraftRequest,
  patchDraftRequest: vi.fn(),
}));

vi.mock("@/lib/architecture/architecture-creation-init", () => ({
  architectureCreationDefaultActorSet: vi.fn(),
  applyArchitectureCreationDraftToFormState: vi.fn(),
  initializeArchitectureCreation,
}));

vi.mock("@/lib/architecture/architecture-draft-structured-brief", () => ({
  structuredBriefToPatchPayload: vi.fn(),
}));

vi.mock("@/lib/architecture/architecture-draft-blocked-reason", () => ({
  architectureDraftBlockedReason: vi.fn(() => null),
  architectureDraftCreateMutationBlockedReason: vi.fn(() => null),
}));

vi.mock("@/lib/api-load-failure", () => ({
  toApiLoadFailure: vi.fn((error: unknown) => error),
}));

vi.mock("@/lib/architecture/architecture-creation-session", () => ({
  writeArchitectureCreationDraftId: vi.fn(),
}));

vi.mock("@/lib/architecture/architecture-workflow-intent", () => ({
  CREATE_ARCHITECTURE_INTENT: "create-architecture",
  START_REVIEW_INTENT: "start-review",
}));

vi.mock("@/lib/architecture/architecture-draft-handoff-gate", () => ({
  architectureDraftSpawnedRunId: vi.fn(() => null),
}));

vi.mock("@/lib/architecture/architecture-draft-intake-mode", () => ({
  isGuidedIntakeAccessBlocked: vi.fn(() => false),
  resolveGuidedIntakeBlockedRedirectHref: vi.fn(() => "/architecture/reviews/new"),
}));

vi.mock("@/lib/guided-intake-clarification-progress", () => ({
  mergeAdmittedRequiredMustQuestionKeys: vi.fn(),
}));

import { useGuidedIntakeDraftCreate } from "./use-guided-intake-draft-create";

describe("useGuidedIntakeDraftCreate", () => {
  it("reports a source-architecture load failure instead of leaving an unhandled rejection", async () => {
    const failure = new Error("source architecture unavailable");
    getDraftRequest.mockRejectedValueOnce(failure);
    const setSubmitError = vi.fn();

    renderHook(() =>
      useGuidedIntakeDraftCreate({
        core: { setSubmitError } as never,
        form: {} as never,
        isCreateArchitectureFlow: false,
        navigate: vi.fn(),
        priorRunId: null,
        setStep: vi.fn(),
        sourceArchitectureId: "architecture-123",
      }),
    );

    await waitFor(() => {
      expect(setSubmitError).toHaveBeenCalledWith(failure);
    });
  });

  it("reports create-architecture initialization failure instead of leaving an unhandled rejection", async () => {
    const failure = new Error("create architecture unavailable");
    initializeArchitectureCreation.mockRejectedValueOnce(failure);
    const setSubmitError = vi.fn();

    renderHook(() =>
      useGuidedIntakeDraftCreate({
        core: { setSubmitError } as never,
        form: {} as never,
        isCreateArchitectureFlow: true,
        navigate: vi.fn(),
        priorRunId: null,
        setStep: vi.fn(),
        sourceArchitectureId: "",
      }),
    );

    await waitFor(() => {
      expect(setSubmitError).toHaveBeenCalledWith(failure);
    });
  });

  it("reports clarification hydration failure instead of rejecting session restore", async () => {
    const failure = new Error("clarifications unavailable");
    getDraftQuestions.mockRejectedValueOnce(failure);
    const setSubmitError = vi.fn();
    const core = {
      setClarificationSelectionHydrated: vi.fn(),
      setAllQuestions: vi.fn(),
      setRequiredMustQuestionKeys: vi.fn(),
      setPendingQuestions: vi.fn(),
      setSubmitError,
    } as never;
    const { result } = renderHook(() =>
      useGuidedIntakeDraftCreate({
        core,
        form: {
          setFreeTextIntent: vi.fn(),
          setBusinessOutcome: vi.fn(),
          setSystemName: vi.fn(),
          setActorSet: vi.fn(),
        } as never,
        isCreateArchitectureFlow: false,
        navigate: vi.fn(),
        priorRunId: null,
        setStep: vi.fn(),
        sourceArchitectureId: "",
      }),
    );

    await act(async () => {
      await result.current.hydrateClarificationsFromDraft("draft-1");
    });

    expect(setSubmitError).toHaveBeenCalledWith(failure);
  });

  it("reports branch clarification refresh failure instead of rejecting branch selection", async () => {
    const failure = new Error("branch clarifications unavailable");
    getDraftQuestions.mockRejectedValueOnce(failure);
    const setSubmitError = vi.fn();
    const core = {
      setDraftId: vi.fn(),
      setDraftStatus: vi.fn(),
      setParentDraftId: vi.fn(),
      setParentSpawnedRunId: vi.fn(),
      setAnswers: vi.fn(),
      setSavedLocallyQuestionKeys: vi.fn(),
      setAdmittedRequiredMustQuestionKeys: vi.fn(),
      setSubmitError,
    } as never;
    const { result } = renderHook(() =>
      useGuidedIntakeDraftCreate({
        core,
        form: {
          setFreeTextIntent: vi.fn(),
          setBusinessOutcome: vi.fn(),
          setSystemName: vi.fn(),
          setActorSet: vi.fn(),
        } as never,
        isCreateArchitectureFlow: false,
        navigate: vi.fn(),
        priorRunId: null,
        setStep: vi.fn(),
        sourceArchitectureId: "",
      }),
    );

    await act(async () => {
      await result.current.applyBranchDraft({
        parentDraftId: "parent-draft",
        parentSpawnedRunId: null,
        branch: {
          draftId: "branch-draft",
          status: "Draft",
          document: {
            freeTextIntent: "Review the branch.",
            businessOutcome: "Reduce operational risk.",
            systemName: "Branch architecture",
            actorSet: { actors: [] },
          },
        },
      } as never);
    });

    expect(setSubmitError).toHaveBeenCalledWith(failure);
  });
});
