import {
  getReviewAssumptionAcknowledgement,
  putReviewAssumptionAcknowledgement,
} from "@/lib/api/review-assumption-acknowledgement-api";
import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";

import {
  readAcknowledgedAssumptionIds,
  writeAcknowledgedAssumptionIds,
} from "./review-assumption-ack-store";

/**
 * The acknowledgement endpoint is constrained to `{runId:guid}`; preview / fixture run ids
 * (e.g. `run-1`) stay localStorage-only so the strip keeps working without a server round-trip.
 */
export function isServerBackedAssumptionAckRun(runId: string): boolean {
  return isUuidLike(runId);
}

export function mergeAcknowledgedAssumptionIds(
  local: ReadonlySet<string>,
  server: readonly string[],
): ReadonlySet<string> {
  const merged = new Set(local);

  for (const id of server) {
    if (id.trim().length > 0) {
      merged.add(id);
    }
  }

  return merged;
}

/**
 * Load server acknowledgements, union them with the local cache, and write the merged set back to
 * the store so every strip / finalize gate on the page observes the same ids. Returns `null` when
 * the run is not server-backed or the request fails (the local cache remains authoritative).
 */
export async function hydrateAcknowledgedAssumptionIdsFromServer(
  runId: string,
): Promise<ReadonlySet<string> | null> {
  if (!isServerBackedAssumptionAckRun(runId)) {
    return null;
  }

  try {
    const document = await getReviewAssumptionAcknowledgement(runId);
    const merged = mergeAcknowledgedAssumptionIds(
      readAcknowledgedAssumptionIds(runId),
      document.acknowledgedAssumptionIds ?? [],
    );

    writeAcknowledgedAssumptionIds(runId, merged);

    return merged;
  } catch {
    return null;
  }
}

/**
 * Best-effort push of the full acknowledged set. Failure is tolerated because the finalize
 * request also carries the local ids in its body and the server unions both sources.
 */
export async function pushAcknowledgedAssumptionIdsToServer(
  runId: string,
  ids: ReadonlySet<string>,
): Promise<boolean> {
  if (!isServerBackedAssumptionAckRun(runId)) {
    return false;
  }

  try {
    await putReviewAssumptionAcknowledgement(runId, ids);

    return true;
  } catch {
    return false;
  }
}
