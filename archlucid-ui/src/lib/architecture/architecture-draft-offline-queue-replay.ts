import { patchDraftRequest } from "@/lib/api/draft-intake-api";
import { isApiRequestError } from "@/lib/api-request-error";
import {
  dequeueArchitectureDraftOfflinePatch,
  listArchitectureDraftOfflineQueue,
  offlineQueueEntryHasCasToken,
  type ArchitectureDraftOfflineQueueEntry,
} from "@/lib/architecture/architecture-draft-offline-queue";
import {
  architectureDraftCasConflictMessage,
  DRAFT_CAS_TOKEN_MISSING_CODE,
  readDraftCasConflictCode,
  withDraftPatchCas,
} from "@/lib/architecture/architecture-draft-patch-cas";

export type ArchitectureDraftOfflineReplayConflict = {
  readonly draftId: string;
  readonly message: string;
  readonly keptEntry: true;
};

export type ArchitectureDraftOfflineReplayResult = {
  readonly dequeuedDraftIds: readonly string[];
  readonly conflict: ArchitectureDraftOfflineReplayConflict | null;
  readonly stoppedOnTransientFailure: boolean;
};

function parseFieldPayload(entry: ArchitectureDraftOfflineQueueEntry): Record<string, unknown> {
  try {
    const parsed = JSON.parse(entry.payloadJson) as unknown;

    if (parsed !== null && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
}

/**
 * Replay queued draft PATCHes with ADR 0088 CAS. Never omit-token PATCH. 409/401/5xx keep the entry.
 */
export async function replayArchitectureDraftOfflineQueue(): Promise<ArchitectureDraftOfflineReplayResult> {
  const queued = listArchitectureDraftOfflineQueue();
  const dequeuedDraftIds: string[] = [];

  for (const entry of queued) {
    if (!offlineQueueEntryHasCasToken(entry)) {
      return {
        dequeuedDraftIds,
        conflict: {
          draftId: entry.draftId,
          message: architectureDraftCasConflictMessage(DRAFT_CAS_TOKEN_MISSING_CODE),
          keptEntry: true,
        },
        stoppedOnTransientFailure: false,
      };
    }

    try {
      const payload = parseFieldPayload(entry);
      const body = withDraftPatchCas(payload, { expectedUpdatedUtc: entry.expectedUpdatedUtc });
      await patchDraftRequest(entry.draftId, body);
      dequeueArchitectureDraftOfflinePatch(entry.draftId);
      dequeuedDraftIds.push(entry.draftId);
    } catch (error: unknown) {
      if (isApiRequestError(error) && error.httpStatus === 409) {
        return {
          dequeuedDraftIds,
          conflict: {
            draftId: entry.draftId,
            message: architectureDraftCasConflictMessage(readDraftCasConflictCode(error)),
            keptEntry: true,
          },
          stoppedOnTransientFailure: false,
        };
      }

      return {
        dequeuedDraftIds,
        conflict: null,
        stoppedOnTransientFailure: true,
      };
    }
  }

  return {
    dequeuedDraftIds,
    conflict: null,
    stoppedOnTransientFailure: false,
  };
}
