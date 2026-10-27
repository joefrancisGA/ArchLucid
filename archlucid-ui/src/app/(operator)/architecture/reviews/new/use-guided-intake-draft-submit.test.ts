import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getDraftRequest = vi.fn();
const submitDraftRequest = vi.fn();
const invalidateOperatorHomeRunsCaches = vi.fn();

vi.mock("@/lib/api/draft-intake-api", () => ({
  getDraftRequest: (...args: unknown[]) => getDraftRequest(...args),
  submitDraftRequest: (...args: unknown[]) => submitDraftRequest(...args),
}));

const upsertArchitectureDraftRegistryEntry = vi.fn();

vi.mock("@/lib/architecture/architecture-draft-registry", () => ({
  buildArchitectureDraftRegistryEntry: vi.fn(() => ({
    draftId: "draft-1",
    displayName: "PartnerApiPlatform",
    customerStatus: "ready-for-review",
    ownerLabel: "owner",
    lastUpdatedUtc: "2026-08-05T12:00:00Z",
    linkedReviewId: "run-guided-1",
    parentArchitectureId: "arch-1",
    serverUpdatedUtc: "2026-08-05T12:00:00Z",
  })),
  upsertArchitectureDraftRegistryEntry: (...args: unknown[]) => upsertArchitectureDraftRegistryEntry(...args),
}));

vi.mock("@/lib/first-tenant-funnel-telemetry", () => ({
  recordFirstTenantFunnelEvent: vi.fn(),
}));

vi.mock("@/lib/operations/review-pipeline-in-flight", () => ({
  trackReviewPipelineInFlight: vi.fn(),
}));

vi.mock("@/lib/operator/operator-query-invalidation", () => ({
  invalidateOperatorHomeRunsCaches: (...args: unknown[]) => invalidateOperatorHomeRunsCaches(...args),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

vi.mock("@/lib/review-generation-handoff", () => ({
  buildReviewGenerationRedirect: () => "/architecture/reviews/run-guided-1/generation",
}));

import type { GuidedIntakeBriefForm } from "./use-guided-intake-brief-form";
import type { GuidedIntakeDraftCoreState } from "./use-guided-intake-draft-workflow";
import { useGuidedIntakeDraftSubmit } from "./use-guided-intake-draft-submit";

function buildForm(): GuidedIntakeBriefForm {
  return {
    evidenceFiles: [],
    setEvidenceFiles: vi.fn(),
    systemName: "PartnerApiPlatform",
    businessOutcome: "Reduce triage time.",
    freeTextIntent: "A sufficiently long architecture intent for admission.",
    actorSet: { actors: [] },
  } as unknown as GuidedIntakeBriefForm;
}

function buildCore(overrides?: Partial<GuidedIntakeDraftCoreState>): GuidedIntakeDraftCoreState {
  return {
    draftId: "draft-1",
    parentSpawnedRunId: null,
    setBusy: vi.fn(),
    setSubmitError: vi.fn(),
    setDraftStatus: vi.fn(),
    setLinkedSpawnedRunId: vi.fn(),
    ...overrides,
  } as unknown as GuidedIntakeDraftCoreState;
}

describe("useGuidedIntakeDraftSubmit", () => {
  beforeEach(() => {
    getDraftRequest.mockReset();
    submitDraftRequest.mockReset();
    invalidateOperatorHomeRunsCaches.mockReset();

    getDraftRequest.mockResolvedValue({
      draftId: "draft-1",
      status: "Admitted",
      updatedUtc: "2026-08-05T12:00:00Z",
      architectureId: "arch-1",
      spawnedRunId: null,
      document: {
        systemName: "PartnerApiPlatform",
        freeTextIntent: "A sufficiently long architecture intent for admission.",
        businessOutcome: "Reduce triage time.",
      },
    });
    submitDraftRequest.mockResolvedValue({
      runId: "run-guided-1",
      parentSpawnedRunId: null,
    });
    invalidateOperatorHomeRunsCaches.mockResolvedValue(undefined);
  });

  it("still navigates to generation when operator-home cache invalidation fails after draft submit", async () => {
    invalidateOperatorHomeRunsCaches.mockRejectedValueOnce(new Error("cache invalidation failed"));
    const navigate = vi.fn();
    const setSubmitError = vi.fn();
    const clearSession = vi.fn();

    const { result } = renderHook(() =>
      useGuidedIntakeDraftSubmit({
        form: buildForm(),
        isCreateArchitectureFlow: false,
        navigate,
        clearSession,
        core: buildCore({ setSubmitError }),
      }),
    );

    await act(async () => {
      await result.current.submitDraft();
    });

    expect(submitDraftRequest).toHaveBeenCalledWith("draft-1", "2026-08-05T12:00:00Z");
    expect(invalidateOperatorHomeRunsCaches).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/architecture/reviews/run-guided-1/generation");
    expect(clearSession).toHaveBeenCalled();
    expect(setSubmitError.mock.calls.some((call) => call[0] instanceof Error)).toBe(false);
  });
});
