import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import {
  ARCHITECTURE_DRAFT_OFFLINE_QUEUE_SCHEMA_VERSION,
  enqueueArchitectureDraftOfflinePatch,
  listArchitectureDraftOfflineQueue,
  resetArchitectureDraftOfflineQueueForTests,
} from "@/lib/architecture/architecture-draft-offline-queue";
import { replayArchitectureDraftOfflineQueue } from "@/lib/architecture/architecture-draft-offline-queue-replay";
import { DRAFT_CAS_STALE_CODE, DRAFT_CAS_TOKEN_MISSING_CODE } from "@/lib/architecture/architecture-draft-patch-cas";

const patchDraftRequest = vi.fn();

vi.mock("@/lib/api/draft-intake-api", () => ({
  patchDraftRequest: (...args: unknown[]) => patchDraftRequest(...args),
}));

describe("architecture-draft-offline-queue-replay (LW-039–047)", () => {
  afterEach(() => {
    resetArchitectureDraftOfflineQueueForTests();
    patchDraftRequest.mockReset();
  });

  it("sends expectedUpdatedUtc and dequeues on 2xx", async () => {
    enqueueArchitectureDraftOfflinePatch({
      draftId: "draft-ok",
      payloadJson: JSON.stringify({ businessOutcome: "ok" }),
      queuedAtUtc: "2026-09-10T12:00:00.000Z",
      expectedUpdatedUtc: "2026-09-10T11:00:00.000Z",
      schemaVersion: ARCHITECTURE_DRAFT_OFFLINE_QUEUE_SCHEMA_VERSION,
    });
    patchDraftRequest.mockResolvedValue({ draftId: "draft-ok", updatedUtc: "2026-09-10T12:01:00.000Z" });

    const result = await replayArchitectureDraftOfflineQueue();

    expect(patchDraftRequest).toHaveBeenCalledWith(
      "draft-ok",
      expect.objectContaining({ expectedUpdatedUtc: "2026-09-10T11:00:00.000Z" }),
    );
    expect(result.dequeuedDraftIds).toEqual(["draft-ok"]);
    expect(listArchitectureDraftOfflineQueue()).toHaveLength(0);
  });

  it("keeps the entry on 409 and does not claim success dequeue", async () => {
    enqueueArchitectureDraftOfflinePatch({
      draftId: "draft-409",
      payloadJson: JSON.stringify({ businessOutcome: "conflict" }),
      queuedAtUtc: "2026-09-10T12:00:00.000Z",
      expectedUpdatedUtc: "2026-09-10T11:00:00.000Z",
      schemaVersion: ARCHITECTURE_DRAFT_OFFLINE_QUEUE_SCHEMA_VERSION,
    });
    patchDraftRequest.mockRejectedValue(
      new ApiRequestError("stale", {
        problem: { errorCode: DRAFT_CAS_STALE_CODE, title: "Draft CAS stale" },
        correlationId: null,
        httpStatus: 409,
      }),
    );

    const result = await replayArchitectureDraftOfflineQueue();

    expect(result.conflict?.draftId).toBe("draft-409");
    expect(result.conflict?.keptEntry).toBe(true);
    expect(result.dequeuedDraftIds).toEqual([]);
    expect(listArchitectureDraftOfflineQueue()).toHaveLength(1);
  });

  it("does not omit-token PATCH v1 leftovers", async () => {
    enqueueArchitectureDraftOfflinePatch({
      draftId: "draft-v1",
      payloadJson: JSON.stringify({ businessOutcome: "legacy" }),
      queuedAtUtc: "2026-09-01T00:00:00.000Z",
      expectedUpdatedUtc: null,
      schemaVersion: ARCHITECTURE_DRAFT_OFFLINE_QUEUE_SCHEMA_VERSION,
    });

    const result = await replayArchitectureDraftOfflineQueue();

    expect(patchDraftRequest).not.toHaveBeenCalled();
    expect(result.conflict?.message.toLowerCase()).toMatch(/version token/);
    expect(listArchitectureDraftOfflineQueue()).toHaveLength(1);
    expect(result.conflict?.message).toContain("not another session");
    expect(DRAFT_CAS_TOKEN_MISSING_CODE).toBe("draft_cas_token_missing");
  });
});
