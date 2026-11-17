import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { tryAcquireDraftWorkLease } from "@/lib/api/draft-intake-api";
import type { DraftWorkLeaseAcquireOutcome } from "@/lib/api/draft-intake-api-work-lease";
import type { DraftRequestResponse } from "@/types/draft-intake";

import { useArchitectureDraftWorkLease } from "./use-architecture-draft-work-lease";

vi.mock("@/lib/api/draft-intake-api", () => ({
  heartbeatDraftWorkLease: vi.fn(),
  readDraftWorkLeaseHeartbeatLost: vi.fn(),
  releaseDraftWorkLease: vi.fn(async () => undefined),
  stealDraftWorkLease: vi.fn(),
  tryAcquireDraftWorkLease: vi.fn(),
}));

const createdUtc = "2026-11-15T12:00:00Z";
const expiresUtc = "2026-11-15T12:05:00Z";

function draft(draftId: string): DraftRequestResponse {
  return {
    draftId,
    tenantId: "tenant",
    workspaceId: "workspace",
    projectId: "project",
    status: "Drafting",
    document: { freeTextIntent: "", actorSet: { actors: [] } },
    createdUtc,
    updatedUtc: createdUtc,
  };
}

it("acquires the new draft lease and ignores a late result for the previous draft", async () => {
  let finishOldRequest: (outcome: DraftWorkLeaseAcquireOutcome) => void = () => undefined;
  const oldRequest = new Promise<DraftWorkLeaseAcquireOutcome>((resolve) => {
    finishOldRequest = resolve;
  });
  const newLease = {
    draftId: "new-draft",
    architectureId: "architecture",
    holderUserId: "current-user",
    holderActorOid: "current-actor",
    acquiredUtc: createdUtc,
    expiresUtc,
    heldByCaller: true,
  };
  const acquire = vi.mocked(tryAcquireDraftWorkLease);
  acquire
    .mockReturnValueOnce(oldRequest)
    .mockResolvedValueOnce({ kind: "acquired", lease: newLease });

  const { result, rerender } = renderHook(
    ({ draftId }) => useArchitectureDraftWorkLease(draftId, draft(draftId), true),
    { initialProps: { draftId: "old-draft" } },
  );
  expect(acquire).toHaveBeenCalledWith("old-draft");
  rerender({ draftId: "new-draft" });

  expect(acquire).toHaveBeenCalledWith("new-draft");
  await waitFor(() => expect(result.current.lease).toEqual(newLease));

  await act(async () => {
    finishOldRequest({
      kind: "held-by-other",
      conflict: {
        draftId: "old-draft",
        holderUserId: "previous-user",
        holderActorOid: "previous-actor",
        expiresUtc,
      },
    });
  });

  expect(result.current.lease).toEqual(newLease);
  expect(result.current.heldByOther).toBe(false);
});
