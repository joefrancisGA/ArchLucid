import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";

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

import { ARCHITECTURE_CREATION_BOOTSTRAP_INTENT } from "@/lib/architecture/architecture-creation-bootstrap";
import { useArchitectureDraftAutosave } from "@/hooks/use-architecture-draft-autosave";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
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
      structuredBrief: fields.structuredBrief,
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

  it("does not immediately re-PATCH after saving only the architecture name on a bootstrap draft", async () => {
    const systemNameOnly: ArchitectureDraftFieldState = {
      freeTextIntent: "",
      businessOutcome: "",
      systemName: "Claims intake",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
    };

    createDraftRequest.mockResolvedValueOnce({
      draftId: "draft-001",
      tenantId: "tenant",
      workspaceId: "ws",
      projectId: "default",
      status: "Drafting",
      document: {
        freeTextIntent: ARCHITECTURE_CREATION_BOOTSTRAP_INTENT,
        businessOutcome: "",
        systemName: "",
        actorSet,
        workflowIntent: "create-architecture",
        structuredBrief: emptyArchitectureDraftStructuredBrief(),
      },
      createdUtc: "2026-08-11T11:00:00.000Z",
      updatedUtc: "2026-08-11T11:00:00.000Z",
    });

    getDraftRequest.mockResolvedValue(
      draftResponse(
        {
          ...systemNameOnly,
          freeTextIntent: ARCHITECTURE_CREATION_BOOTSTRAP_INTENT,
        },
        "2026-08-11T12:00:00.000Z",
      ),
    );

    patchDraftRequest.mockResolvedValue(
      draftResponse(
        {
          ...systemNameOnly,
          freeTextIntent: ARCHITECTURE_CREATION_BOOTSTRAP_INTENT,
        },
        "2026-08-11T12:00:30.000Z",
      ),
    );

    const { result, rerender } = renderHook(
      (props: { fields: ArchitectureDraftFieldState }) =>
        useArchitectureDraftAutosave({
          architectureId: "new",
          fields: props.fields,
          actorSet,
          deferCreateUntilFirstSave: true,
        }),
      {
        initialProps: {
          fields: {
            freeTextIntent: "",
            businessOutcome: "",
            systemName: "",
            structuredBrief: emptyArchitectureDraftStructuredBrief(),
          },
        },
      },
    );

    rerender({ fields: systemNameOnly });

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(createDraftRequest).toHaveBeenCalledTimes(1);
    expect(getDraftRequest).toHaveBeenCalledTimes(1);
    expect(patchDraftRequest).toHaveBeenCalledTimes(1);
    expect(result.current.saveState).toBe("saved");

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
    });

    expect(getDraftRequest).toHaveBeenCalledTimes(1);
    expect(patchDraftRequest).toHaveBeenCalledTimes(1);
  });

  it("debounces autosave while the architecture name is being typed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const partialName: ArchitectureDraftFieldState = {
      freeTextIntent: "",
      businessOutcome: "",
      systemName: "Cl",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
    };
    const fullName: ArchitectureDraftFieldState = {
      ...partialName,
      systemName: "Claims intake",
    };

    getDraftRequest.mockResolvedValue(draftResponse(fullName, "2026-08-11T12:00:00.000Z"));
    patchDraftRequest.mockResolvedValue(draftResponse(fullName, "2026-08-11T12:00:30.000Z"));

    const { rerender } = renderHook(
      (props: { fields: ArchitectureDraftFieldState }) =>
        useArchitectureDraftAutosave({
          architectureId: "draft-001",
          fields: props.fields,
          actorSet,
        }),
      { initialProps: { fields: partialName } },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(patchDraftRequest).not.toHaveBeenCalled();

    rerender({ fields: fullName });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(patchDraftRequest).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    await waitFor(() => {
      expect(patchDraftRequest).toHaveBeenCalledTimes(1);
    });
  });

  it("acceptServerBaseline prevents a spurious save after hydrate", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const intent = longIntent();
    const hydrated: ArchitectureDraftFieldState = {
      freeTextIntent: intent,
      businessOutcome: "Reduce intake cycle time for architecture reviews.",
      systemName: "B2B SaaS Tenant Migration Platform",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
    };

    const { result, rerender } = renderHook(
      (props: { fields: ArchitectureDraftFieldState }) =>
        useArchitectureDraftAutosave({
          architectureId: "draft-001",
          fields: props.fields,
          actorSet,
        }),
      { initialProps: { fields: { freeTextIntent: "", businessOutcome: "", systemName: "", structuredBrief: emptyArchitectureDraftStructuredBrief() } } },
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
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
    };
    const complete: ArchitectureDraftFieldState = {
      freeTextIntent: intentOnly.freeTextIntent,
      businessOutcome: "Reduce intake cycle time for architecture reviews.",
      systemName: "B2B SaaS Tenant Migration Platform",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
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

  it("omits freeTextIntent from PATCH when the overview is still empty", async () => {
    const fields: ArchitectureDraftFieldState = {
      freeTextIntent: "",
      businessOutcome: "Reduce intake cycle time for architecture reviews.",
      systemName: "B2B SaaS Tenant Migration Platform",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
    };

    getDraftRequest.mockResolvedValueOnce(draftResponse(fields, "2026-08-11T12:00:00.000Z"));
    patchDraftRequest.mockResolvedValueOnce(draftResponse(fields, "2026-08-11T12:00:30.000Z"));

    const { result } = renderHook(() =>
      useArchitectureDraftAutosave({
        architectureId: "draft-001",
        fields,
        actorSet,
      }),
    );

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(patchDraftRequest).toHaveBeenCalledTimes(1);
    const patchBody = patchDraftRequest.mock.calls[0]?.[1] as { freeTextIntent?: string };
    expect(patchBody.freeTextIntent).toBeUndefined();
  });

  it("does not retry PATCH in a loop after a non-retryable 400", async () => {
    const fields: ArchitectureDraftFieldState = {
      freeTextIntent: longIntent(),
      businessOutcome: "Reduce intake cycle time for architecture reviews.",
      systemName: "B2B SaaS Tenant Migration Platform",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
    };

    getDraftRequest.mockResolvedValue(draftResponse(fields, "2026-08-11T12:00:00.000Z"));
    patchDraftRequest.mockRejectedValue(
      new ApiRequestError("Draft is not mutable", {
        problem: null,
        correlationId: "corr-400",
        httpStatus: 400,
      }),
    );

    const { result } = renderHook(() =>
      useArchitectureDraftAutosave({
        architectureId: "draft-001",
        fields,
        actorSet,
      }),
    );

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(patchDraftRequest).toHaveBeenCalledTimes(1);
    expect(result.current.saveState).toBe("error");
  });

  it("does not run a queued trailing save after a non-retryable 400", async () => {
    const intentOnly: ArchitectureDraftFieldState = {
      freeTextIntent: longIntent("intent-only"),
      businessOutcome: "",
      systemName: "",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
    };
    const complete: ArchitectureDraftFieldState = {
      freeTextIntent: intentOnly.freeTextIntent,
      businessOutcome: "Reduce intake cycle time for architecture reviews.",
      systemName: "B2B SaaS Tenant Migration Platform",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
    };

    let resolveFirstPatch: ((value: unknown) => void) | null = null;

    getDraftRequest
      .mockResolvedValueOnce(draftResponse(intentOnly, "2026-08-11T12:00:00.000Z"))
      .mockResolvedValueOnce(draftResponse(intentOnly, "2026-08-11T12:00:30.000Z"));
    patchDraftRequest.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          resolveFirstPatch = reject;
        }),
    );

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

    rerender({ fields: complete });

    let queuedSave: Promise<boolean> | undefined;

    await act(async () => {
      queuedSave = result.current.saveDraft();
    });

    await act(async () => {
      resolveFirstPatch?.(
        new ApiRequestError("Draft is not mutable", {
          problem: null,
          correlationId: "corr-400",
          httpStatus: 400,
        }),
      );
      await firstSave;
      await queuedSave;
    });

    expect(patchDraftRequest).toHaveBeenCalledTimes(1);
    expect(result.current.saveState).toBe("error");
  });

  it("skips PATCH when the server draft is no longer Drafting", async () => {
    const fields: ArchitectureDraftFieldState = {
      freeTextIntent: longIntent(),
      businessOutcome: "Reduce intake cycle time for architecture reviews.",
      systemName: "B2B SaaS Tenant Migration Platform",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
    };

    const onImmutableDraftDetected = vi.fn();

    getDraftRequest.mockResolvedValueOnce({
      ...draftResponse(fields, "2026-08-11T12:00:00.000Z"),
      status: "Admitted",
    });

    const { result } = renderHook(() =>
      useArchitectureDraftAutosave({
        architectureId: "draft-001",
        fields,
        actorSet,
        onImmutableDraftDetected,
      }),
    );

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(patchDraftRequest).not.toHaveBeenCalled();
    expect(onImmutableDraftDetected).toHaveBeenCalledTimes(1);
    expect(result.current.saveState).toBe("idle");
    expect(result.current.conflictMessage).toBeNull();
  });
});
