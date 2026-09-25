import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const admitDraftRequest = vi.fn();
const createDraftRequest = vi.fn();
const getDraftRequest = vi.fn();
const patchDraftRequest = vi.fn();

vi.mock("@/lib/api/draft-intake-api", () => ({
  admitDraftRequest: (...args: unknown[]) => admitDraftRequest(...args),
  createDraftRequest: (...args: unknown[]) => createDraftRequest(...args),
  getDraftRequest: (...args: unknown[]) => getDraftRequest(...args),
  patchDraftRequest: (...args: unknown[]) => patchDraftRequest(...args),
  answerDraftQuestion: vi.fn(),
  skipDraftQuestion: vi.fn(),
}));

vi.mock("@/lib/architecture/architecture-draft-registry", () => ({
  buildArchitectureDraftRegistryEntry: vi.fn(() => ({})),
  upsertArchitectureDraftRegistryEntry: vi.fn(),
}));

import { START_REVIEW_INTENT } from "@/lib/architecture/architecture-workflow-intent";
import type { GuidedIntakeBriefForm } from "./use-guided-intake-brief-form";
import type { GuidedIntakeDraftCoreState } from "./use-guided-intake-draft-workflow";
import { useGuidedIntakeDraftAdmit } from "./use-guided-intake-draft-admit";

function buildForm(overrides: Partial<GuidedIntakeBriefForm>): GuidedIntakeBriefForm {
  return {
    freeTextIntent: "A sufficiently long architecture intent for admission.",
    businessOutcome: "Reduce triage time.",
    systemName: "PartnerApiPlatform",
    actorSet: { actors: [] },
    focusedPilotModeEnabled: true,
    briefTextForAdmission: () => "A sufficiently long architecture intent for admission.",
    ...overrides,
  } as unknown as GuidedIntakeBriefForm;
}

function buildCore(): GuidedIntakeDraftCoreState {
  return {
    draftId: null,
    structuredBrief: {},
    setBusy: vi.fn(),
    setSubmitError: vi.fn(),
    setRedirectReason: vi.fn(),
    setRedirectVerdict: vi.fn(),
    setDraftId: vi.fn(),
    setDraftStatus: vi.fn(),
    setPendingQuestions: vi.fn(),
    setRequiredMustQuestionKeys: vi.fn(),
    setSavedLocallyQuestionKeys: vi.fn(),
    setClarificationSelectionHydrated: vi.fn(),
    setViewAllClarifications: vi.fn(),
  } as unknown as GuidedIntakeDraftCoreState;
}

describe("useGuidedIntakeDraftAdmit", () => {
  beforeEach(() => {
    admitDraftRequest.mockReset();
    createDraftRequest.mockReset();
    getDraftRequest.mockReset();
    patchDraftRequest.mockReset();

    createDraftRequest.mockResolvedValue({ draftId: "draft-1", updatedUtc: "2026-08-05T12:00:00Z" });
    patchDraftRequest.mockResolvedValue({ draftId: "draft-1", status: "Drafting" });
    admitDraftRequest.mockResolvedValue({
      admitted: true,
      pendingMustQuestions: [],
      requiredMustQuestionKeys: [],
      draft: { draftId: "draft-1", document: {} },
      verdict: { kind: "Feasible", summary: "ok" },
    });
    getDraftRequest.mockResolvedValue({
      draftId: "draft-1",
      status: "Admitted",
      updatedUtc: "2026-08-05T12:00:00Z",
      document: {},
    });
  });

  it("passes the system name on the initial create so the identity is named after it", async () => {
    const { result } = renderHook(() =>
      useGuidedIntakeDraftAdmit({
        form: buildForm({ systemName: "PartnerApiPlatform" }),
        isCreateArchitectureFlow: false,
        priorRunId: null,
        setStep: vi.fn(),
        core: buildCore(),
        refreshQuestions: vi.fn().mockResolvedValue(undefined),
        applyAdmittedRequiredMustQuestionKeysFromDocument: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.runAdmission();
    });

    await waitFor(() => {
      expect(createDraftRequest).toHaveBeenCalledWith(
        "A sufficiently long architecture intent for admission.",
        START_REVIEW_INTENT,
        null,
        "PartnerApiPlatform",
      );
    });
  });

  it("omits the system name on create when it is blank so the intent names the identity", async () => {
    const { result } = renderHook(() =>
      useGuidedIntakeDraftAdmit({
        form: buildForm({ systemName: "   " }),
        isCreateArchitectureFlow: false,
        priorRunId: null,
        setStep: vi.fn(),
        core: buildCore(),
        refreshQuestions: vi.fn().mockResolvedValue(undefined),
        applyAdmittedRequiredMustQuestionKeysFromDocument: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.runAdmission();
    });

    await waitFor(() => {
      expect(createDraftRequest).toHaveBeenCalledWith(
        "A sufficiently long architecture intent for admission.",
        START_REVIEW_INTENT,
        null,
        "   ",
      );
    });
  });
});
