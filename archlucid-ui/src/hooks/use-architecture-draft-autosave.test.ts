import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createDraftRequest = vi.fn();
const getDraftRequest = vi.fn();
const patchDraftRequest = vi.fn();

vi.mock("@/lib/api/draft-intake-api", () => ({
  buildDefaultActorSet: () => ({
    actors: [
      {
        label: "Primary operator",
        kind: "Human",
        trustOrigin: "Internal",
        contract: "Sync",
        origin: "Asserted",
        confidence: 100,
      },
    ],
  }),
  createDraftRequest: (...args: unknown[]) => createDraftRequest(...args),
  getDraftRequest: (...args: unknown[]) => getDraftRequest(...args),
  patchDraftRequest: (...args: unknown[]) => patchDraftRequest(...args),
}));

vi.mock("@/lib/architecture/architecture-draft-registry", () => ({
  buildArchitectureDraftRegistryEntry: (draft: { draftId: string }) => ({
    architectureId: draft.draftId,
  }),
  upsertArchitectureDraftRegistryEntry: vi.fn(),
}));

import { useArchitectureDraftAutosave } from "@/hooks/use-architecture-draft-autosave";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import type { ActorSet } from "@/types/draft-intake";

const actorSet: ActorSet = {
  actors: [
    {
      label: "Primary operator",
      kind: "Human",
      trustOrigin: "Internal",
      contract: "Sync",
      origin: "Asserted",
      confidence: 100,
    },
  ],
};

function longIntent(suffix = ""): string {
  return `${"Architecture overview text that is long enough to satisfy the minimum intake length for draft persistence. ".repeat(2)}${suffix}`.trim();
}

function draftResponse(fields: ArchitectureDraftFieldState, updatedUtc = "2026-08-11T12:00:00.000Z") {
  return {
    draftId: "draft-001",
    tenantId: "tenant",
    workspaceId: "ws",
    projectId: "default",
    status: "Drafting",
    document: {
      freeTextIntent: fields.freeTextIntent,
      businessOutcome: fields.businessOutcome,
      systemName: fields.systemName,
      actorSet,
      workflowIntent: "create-architecture",
    },
    createdUtc: "2026-08-11T11:00:00.000Z",
    updatedUtc,
  };
}

describe("useArchitectureDraftAutosave", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    createDraftRequest.mockReset();
    getDraftRequest.mockReset();
    patchDraftRequest.mockReset();
  });

  it("acceptServerBaseline prevents a spurious save after hydrate", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const intent = longIntent();
    const hydrated: ArchitectureDraftFieldState = {
      freeTextIntent: intent,
      businessOutcome: "Reduce intake cycle time for governed reviews.",
      systemName: "B2B SaaS Tenant Migration Platform",
    };

    const { result, rerender } = renderHook(
      (props: { fields: ArchitectureDraftFieldState }) =>
        useArchitectureDraftAutosave({
          architectureId: "draft-001",
          fields: props.fields,
          actorSet,
        }),
      { initialProps: { fields: { freeTextIntent: "", businessOutcome: "", systemName: "" } } },
    );

    act(() => {
      result.current.acceptServerBaseline(hydrated, "2026-08-11T12:00:00.000Z");
    });

    rerender({ fields: hydrated });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(patchDraftRequest).not.toHaveBeenCalled();
    expect(result.current.saveState).toBe("idle");
  });

  it("queues a trailing save so edits during an in-flight PATCH are not dropped", async () => {
    const intentOnly: ArchitectureDraftFieldState = {
      freeTextIntent: longIntent("intent-only"),
      businessOutcome: "",
      systemName: "",
    };
    const complete: ArchitectureDraftFieldState = {
      freeTextIntent: intentOnly.freeTextIntent,
      businessOutcome: "Reduce intake cycle time for governed reviews.",
      systemName: "B2B SaaS Tenant Migration Platform",
    };

    let resolveFirstPatch: ((value: unknown) => void) | null = null;

    getDraftRequest
      .mockResolvedValueOnce(draftResponse(intentOnly, "2026-08-11T12:00:00.000Z"))
      .mockResolvedValueOnce(draftResponse(intentOnly, "2026-08-11T12:00:30.000Z"));
    patchDraftRequest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirstPatch = resolve;
        }),
    );
    patchDraftRequest.mockResolvedValueOnce(draftResponse(complete, "2026-08-11T12:01:00.000Z"));

    const { result, rerender } = renderHook(
      (props: { fields: ArchitectureDraftFieldState }) =>
        useArchitectureDraftAutosave({
          architectureId: "draft-001",
          fields: props.fields,
          actorSet,
        }),
      { initialProps: { fields: intentOnly } },
    );

    let firstSave: Promise<boolean> | undefined;

    await act(async () => {
      firstSave = result.current.saveDraft();
    });

    await waitFor(() => {
      expect(patchDraftRequest).toHaveBeenCalledTimes(1);
    });

    const firstPatchBody = patchDraftRequest.mock.calls[0]?.[1] as {
      systemName?: string;
      businessOutcome?: string;
    };
    expect(firstPatchBody.systemName).toBeUndefined();
    expect(firstPatchBody.businessOutcome).toBe("");

    rerender({ fields: complete });

    let queuedSave: Promise<boolean> | undefined;

    // saveDraft() called during an in-flight PATCH resolves with that outstanding request, so the
    // first PATCH has to be released before either promise is awaited.
    await act(async () => {
      queuedSave = result.current.saveDraft();
    });

    await act(async () => {
      resolveFirstPatch?.(draftResponse(intentOnly, "2026-08-11T12:00:30.000Z"));
      await firstSave;
      await queuedSave;
    });

    await waitFor(() => {
      expect(patchDraftRequest).toHaveBeenCalledTimes(2);
    });

    const secondPatchBody = patchDraftRequest.mock.calls[1]?.[1] as {
      systemName?: string;
      businessOutcome?: string;
    };

    expect(secondPatchBody.systemName).toBe(complete.systemName);
    expect(secondPatchBody.businessOutcome).toBe(complete.businessOutcome);
  });
});
