import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { findingInsightSignalMutationBlockedReason } from "@/lib/findings/finding-insight-signal-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { encodeRequiredPathSegment, isRecord, trimmedStringsOnly } from "./api-boundary-normalization";
import { apiGet, apiPostJson } from "./http";

export type FindingInsightSignalKind = "DidNotThinkOfThat" | "Expected" | "DismissAsChecklist";

export type FindingInsightSignalStatusResponse = {
  readonly kinds: readonly FindingInsightSignalKind[];
};

const FINDING_INSIGHT_SIGNAL_KINDS: readonly string[] = ["DidNotThinkOfThat", "Expected", "DismissAsChecklist"];

function isFindingInsightSignalKind(value: string): value is FindingInsightSignalKind {
  return FINDING_INSIGHT_SIGNAL_KINDS.includes(value);
}

/** Builds the insight-signal path. A blank run id or finding id throws before any request is sent. */
function findingInsightSignalPath(runId: string, findingId: string): string {
  const encodedRunId = encodeRequiredPathSegment(runId, "runId");
  const encodedFindingId = encodeRequiredPathSegment(findingId, "findingId");

  return `/v1/runs/${encodedRunId}/findings/${encodedFindingId}/insight-signal`;
}

/** Keeps only the signal kinds the UI knows; a malformed response yields an empty list. */
function toFindingInsightSignalStatus(raw: unknown): FindingInsightSignalStatusResponse {
  const kinds = isRecord(raw) ? trimmedStringsOnly(raw.kinds) : [];

  return { kinds: kinds.filter(isFindingInsightSignalKind) };
}

/** Lists insight signals recorded by the current operator on one finding. */
export async function getFindingInsightSignalStatus(
  runId: string,
  findingId: string,
): Promise<FindingInsightSignalStatusResponse> {
  const path = findingInsightSignalPath(runId, findingId);

  return toFindingInsightSignalStatus(await apiGet<unknown>(path));
}

/** Records an append-only insight signal for one finding (ExecuteAuthority). */
export async function postFindingInsightSignal(
  runId: string,
  findingId: string,
  kind: FindingInsightSignalKind = "DidNotThinkOfThat",
): Promise<void> {
  const path = findingInsightSignalPath(runId, findingId);

  try {
    await apiPostJson(path, { kind });
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = findingInsightSignalMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
