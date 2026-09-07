import { apiGet, apiPostJson } from "./http";
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
    expectedCurrentDispositionRowVersionBase64?: string;
  },
  options?: { readonly idempotencyKey?: string },
): Promise<FindingDispositionEvent> {
  const idempotencyKey = options?.idempotencyKey?.trim() || createGovernanceMutationIdempotencyKey();

  return apiPostJson<FindingDispositionEvent>(
    `${governanceStickinessBase()}/findings/${encodeURIComponent(findingId)}/dispositions`,
    body,
    { extraHeaders: { "Idempotency-Key": idempotencyKey } },
  );
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

  return apiPostJson<RecordBulkFindingDispositionResponse>(
    `${governanceStickinessBase()}/findings/bulk-disposition`,
    body,
    { extraHeaders: { "Idempotency-Key": idempotencyKey } },
  );
}

export async function listFindingDispositions(findingId: string): Promise<FindingDispositionEvent[]> {
  return apiGet<FindingDispositionEvent[]>(
    `${governanceStickinessBase()}/findings/${encodeURIComponent(findingId)}/dispositions`,
  );
}
