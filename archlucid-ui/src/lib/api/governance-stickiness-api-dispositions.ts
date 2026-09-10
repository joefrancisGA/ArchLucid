import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { findingBulkDispositionBlockedReason } from "@/lib/governance/finding-bulk-disposition-blocked-reason";
import { findingDispositionMutationBlockedReason } from "@/lib/findings/finding-disposition-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { apiPostJson } from "./http";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance/governance-mutation-idempotency-key";
import {
  type FindingDispositionEvent,
  type FindingDispositionKind,
  type RecordBulkFindingDispositionResponse,
  governanceStickinessBase,
} from "./governance-stickiness-api-types";

export async function recordFindingDisposition(
  findingId: string,
  body: {
    disposition: FindingDispositionKind;
    rationale?: string;
    runId: string;
    revisitDueUtc?: string;
    evidenceRequestText?: string;
    tradeOffAcknowledgment?: string;
  },
  options?: { readonly idempotencyKey?: string },
): Promise<FindingDispositionEvent> {
  const idempotencyKey = options?.idempotencyKey?.trim() || createGovernanceMutationIdempotencyKey();

  try {
    return await apiPostJson<FindingDispositionEvent>(
      `${governanceStickinessBase()}/findings/${encodeURIComponent(findingId)}/dispositions`,
      body,
      { extraHeaders: { "Idempotency-Key": idempotencyKey } },
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = findingDispositionMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Default revisit horizon (30 days) when bulk-deferring without an explicit operator date. */
export function defaultDeferredRevisitDueUtc(): string {
  const revisitDue = new Date();
  revisitDue.setUTCDate(revisitDue.getUTCDate() + 30);
  return revisitDue.toISOString();
}

export async function recordBulkFindingDisposition(
  body: {
    findingIds: readonly string[];
    disposition: FindingDispositionKind;
    rationale?: string;
    revisitDueUtc?: string;
  },
  options?: { readonly idempotencyKey?: string },
): Promise<RecordBulkFindingDispositionResponse> {
  const idempotencyKey = options?.idempotencyKey?.trim() || createGovernanceMutationIdempotencyKey();

  try {
    return await apiPostJson<RecordBulkFindingDispositionResponse>(
      `${governanceStickinessBase()}/findings/bulk-disposition`,
      body,
      { extraHeaders: { "Idempotency-Key": idempotencyKey } },
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = findingBulkDispositionBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function listFindingDispositions(findingId: string): Promise<FindingDispositionEvent[]> {
  return apiGetSealedManifestAware<FindingDispositionEvent[]>(
    `${governanceStickinessBase()}/findings/${encodeURIComponent(findingId)}/dispositions`,
  );
}
