import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import type { ActorSet, DraftRequestResponse } from "@/types/draft-intake";
import type { ScopeUnderstandingBullet } from "@/lib/architecture/architecture-scope-understanding-check";

const openReview = vi.fn();
const patchDraftRequest = vi.fn();
const upsertArchitectureDraftRegistryEntry = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/architecture/architectures/arch-001/drafts/draft-001",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-review-start-navigation-progress", () => ({
  useReviewStartNavigationProgress: () => ({
    isPending: false,
    begin: vi.fn(),
    markPreparingQuestions: vi.fn(),
    openReview,
    reset: vi.fn(),
  }),
}));

vi.mock("@/lib/api/draft-intake-api", () => ({
  getDraftRequest: vi.fn(),
  patchDraftRequest: (...args: unknown[]) => patchDraftRequest(...args),
}));

vi.mock("@/lib/architecture/architecture-draft-registry", () => ({
  buildArchitectureDraftRegistryEntry: (value: { draftId: string; updatedUtc: string }) => ({
    draftId: value.draftId,
    serverUpdatedUtc: value.updatedUtc,
  }),
  upsertArchitectureDraftRegistryEntry: (...args: unknown[]) => upsertArchitectureDraftRegistryEntry(...args),
}));

import { useArchitectureDraftStartReview } from "./use-architecture-draft-start-review";

const fields: ArchitectureDraftFieldState = {
  systemName: "Claims intake",
  freeTextIntent: "An architecture overview with authentication and audit evidence for the claims intake workflow and its reviewers.",
  businessOutcome: "Reduce review cycle time.",
  structuredBrief: { ...emptyArchitectureDraftStructuredBrief(), qualityAttribute: "RTO 4 hours" },
  openQuestions: "",
};
const actorSet: ActorSet = {
  actors: [{ label: "Operator", kind: "Human", trustOrigin: "Internal", contract: "Sync", origin: "Asserted", confidence: 100 }],
};
const scopeBullets: ScopeUnderstandingBullet[] = [
  { id: "scope-1", kind: "custom", label: "", value: "Claims records remain in the private network", source: "user" },
];
const draft = {
  draftId: "draft-001",
  architectureId: "arch-001",
  tenantId: "tenant",
  workspaceId: "workspace",
  projectId: "default",
  status: "Drafting",
  document: { ...fields, actorSet, workflowIntent: "create-architecture" },
  createdUtc: "2026-09-23T10:00:00Z",
  updatedUtc: "2026-09-23T10:00:00Z",
} as DraftRequestResponse;

describe("useArchitectureDraftStartReview", () => {
  it("opens review after saving confirmed scope without a stale second PATCH", async () => {
    openReview.mockReset();
    patchDraftRequest.mockReset();
    upsertArchitectureDraftRegistryEntry.mockReset();
    patchDraftRequest.mockRejectedValue(new Error("409: stale expectedUpdatedUtc after save"));
    const saveDraft = vi.fn().mockImplementation(async () => {
      upsertArchitectureDraftRegistryEntry({ draftId: "draft-001", serverUpdatedUtc: "2026-09-23T10:01:00Z" });
      return true;
    });

    const { result } = renderHook(() => useArchitectureDraftStartReview({
      isNewDraft: false,
      hasPersistedDraft: true,
      briefFrozen: false,
      linkedReviewId: null,
      effectiveDraftId: "draft-001",
      parentArchitectureId: "arch-001",
      fields,
      actorSet,
      draft,
      saveState: "saved",
      conflictMessage: null,
      saveDraft,
      lastSavedUtc: draft.updatedUtc,
      syncServerUpdatedUtc: vi.fn(),
      scopeGateOpen: true,
      setScopeGateOpen: vi.fn(),
      scopeBullets,
      setScopeBullets: vi.fn(),
      persistedScopeFingerprint: null,
    }));

    await act(async () => {
      await result.current.handleStartReview();
    });

    expect(saveDraft).toHaveBeenCalledOnce();
    expect(patchDraftRequest).not.toHaveBeenCalled();
    expect(upsertArchitectureDraftRegistryEntry).toHaveBeenCalledTimes(1);
    expect(upsertArchitectureDraftRegistryEntry).toHaveBeenCalledWith({
      draftId: "draft-001",
      serverUpdatedUtc: "2026-09-23T10:01:00Z",
    });
    expect(openReview).toHaveBeenCalledWith("/architecture/architectures/arch-001/reviews/new");
    expect(result.current.startReviewError).toBeNull();
  });

  it("does not overwrite the registry's newly saved server version with the old draft snapshot", async () => {
    openReview.mockReset();
    patchDraftRequest.mockReset();
    upsertArchitectureDraftRegistryEntry.mockReset();
    patchDraftRequest.mockResolvedValue({ ...draft, updatedUtc: "2026-09-23T10:02:00Z" });
    const saveDraft = vi.fn().mockImplementation(async () => {
      upsertArchitectureDraftRegistryEntry({ draftId: "draft-001", serverUpdatedUtc: "2026-09-23T10:01:00Z" });
      return true;
    });

    const { result } = renderHook(() => useArchitectureDraftStartReview({
      isNewDraft: false,
      hasPersistedDraft: true,
      briefFrozen: false,
      linkedReviewId: null,
      effectiveDraftId: "draft-001",
      parentArchitectureId: "arch-001",
      fields,
      actorSet,
      draft,
      saveState: "saved",
      conflictMessage: null,
      saveDraft,
      lastSavedUtc: draft.updatedUtc,
      syncServerUpdatedUtc: vi.fn(),
      scopeGateOpen: true,
      setScopeGateOpen: vi.fn(),
      scopeBullets,
      setScopeBullets: vi.fn(),
      persistedScopeFingerprint: null,
    }));

    await act(async () => {
      await result.current.handleStartReview();
    });

    expect(upsertArchitectureDraftRegistryEntry).toHaveBeenCalledOnce();
    expect(upsertArchitectureDraftRegistryEntry).toHaveBeenCalledWith({
      draftId: "draft-001",
      serverUpdatedUtc: "2026-09-23T10:01:00Z",
    });
  });
});
