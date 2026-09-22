import { afterEach, describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_OFFLINE_QUEUE_KEY_V1,
  ARCHITECTURE_DRAFT_OFFLINE_QUEUE_KEY_V2,
  ARCHITECTURE_DRAFT_OFFLINE_QUEUE_SCHEMA_VERSION,
  enqueueArchitectureDraftOfflinePatch,
  listArchitectureDraftOfflineQueue,
  offlineQueueEntryHasCasToken,
  resetArchitectureDraftOfflineQueueForTests,
} from "@/lib/architecture/architecture-draft-offline-queue";

describe("architecture-draft-offline-queue v2 (LW-036 / LW-042 / LW-045)", () => {
  afterEach(() => {
    resetArchitectureDraftOfflineQueueForTests();
  });

  it("enqueue stores expectedUpdatedUtc on the entry", () => {
    enqueueArchitectureDraftOfflinePatch({
      draftId: "draft-1",
      payloadJson: JSON.stringify({ businessOutcome: "outcome" }),
      queuedAtUtc: "2026-09-10T12:00:00.000Z",
      expectedUpdatedUtc: "2026-09-10T11:00:00.000Z",
      schemaVersion: ARCHITECTURE_DRAFT_OFFLINE_QUEUE_SCHEMA_VERSION,
    });

    const listed = listArchitectureDraftOfflineQueue();

    expect(listed).toHaveLength(1);
    expect(listed[0]?.expectedUpdatedUtc).toBe("2026-09-10T11:00:00.000Z");
    expect(offlineQueueEntryHasCasToken(listed[0]!)).toBe(true);
    expect(window.localStorage.getItem(ARCHITECTURE_DRAFT_OFFLINE_QUEUE_KEY_V2)).toContain("expectedUpdatedUtc");
  });

  it("migrates v1 entries without inventing a token", () => {
    window.localStorage.setItem(
      ARCHITECTURE_DRAFT_OFFLINE_QUEUE_KEY_V1,
      JSON.stringify([
        {
          draftId: "legacy-draft",
          payloadJson: JSON.stringify({ businessOutcome: "legacy" }),
          queuedAtUtc: "2026-09-01T00:00:00.000Z",
        },
      ]),
    );

    const listed = listArchitectureDraftOfflineQueue();

    expect(listed).toHaveLength(1);
    expect(listed[0]?.draftId).toBe("legacy-draft");
    expect(listed[0]?.expectedUpdatedUtc).toBeNull();
    expect(offlineQueueEntryHasCasToken(listed[0]!)).toBe(false);
    expect(window.localStorage.getItem(ARCHITECTURE_DRAFT_OFFLINE_QUEUE_KEY_V1)).toBeNull();
  });
});
