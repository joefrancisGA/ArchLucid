import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { executeIdempotentLivelihoodMutation } from "@/lib/auth/livelihood-mutation-401-resume";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance/governance-mutation-idempotency-key";
import { apiPostJson } from "./http";
import {
  type FindingDispositionEvent,
  type FindingDispositionKind,
  type RecordBulkFindingDispositionResponse,
  governanceStickinessBase,
} from "./governance-stickiness-api-types";

export type RecordFindingDispositionBody = {
  disposition: FindingDispositionKind;
  rationale?: string;
  runId: string;
  revisitDueUtc?: string;
  evidenceRequestText?: string;
  tradeOffAcknowledgment?: string;
  expectedCurrentDispositionRowVersionBase64?: string;
  impactPreviewCompleted?: boolean;
  previewOverrideReason?: string;
  architectRestatement?: string;
};

export async function recordFindingDisposition(
  findingId: string,
  body: RecordFindingDispositionBody,
  options?: { readonly idempotencyKey?: string },
): Promise<FindingDispositionEvent> {
  const idempotencyKey = options?.idempotencyKey?.trim() || createGovernanceMutationIdempotencyKey();

  return apiPostJson<FindingDispositionEvent>(
    `${governanceStickinessBase()}/findings/${encodeURIComponent(findingId)}/dispositions`,
    body,
    { extraHeaders: { "Idempotency-Key": idempotencyKey } },
  );
}

/** Disposition POST with 401 session-recovery redirect and single idempotent replay (LP-19). */
export async function recordFindingDispositionWith401Resume(
  findingId: string,
  body: RecordFindingDispositionBody,
  options: { readonly idempotencyKey: string; readonly returnPath: string },
): Promise<FindingDispositionEvent> {
  const idempotencyKey = options.idempotencyKey.trim();

  return executeIdempotentLivelihoodMutation({
    kind: "finding_disposition",
    returnPath: options.returnPath,
    idempotencyKey,
    payload: { findingId, body },
    execute: () => recordFindingDisposition(findingId, body, { idempotencyKey }),
  });
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
    expectedCurrentDispositionRowVersionBase64ByFindingId?: Record<string, string>;
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
  return apiGetSealedManifestAware<FindingDispositionEvent[]>(
    `${governanceStickinessBase()}/findings/${encodeURIComponent(findingId)}/dispositions`,
  );
}
