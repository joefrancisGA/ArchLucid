import { ApiV1Routes } from "@/lib/api-v1-routes";
import type {
  GovernanceBatchReviewResponse,
  GovernanceLineageResult,
  GovernanceRationaleResult,
} from "@/types/governance-dashboard";
import type {
  GovernanceApprovalRequest,
  GovernancePromotionRecord,
} from "@/types/governance-workflow";
import { shouldSkipLiveAuthorityRunScopedApi } from "@/lib/operator-static-demo/run-scoped-live-api";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { governanceApprovalLineageBlockedReason } from "@/lib/governance/governance-approval-lineage-blocked-reason";
import { governanceWorkflowMutationBlockedReason } from "@/lib/governance/governance-workflow-mutation-blocked-reason";
import { governanceWorkflowRunReadBlockedReason } from "@/lib/governance/governance-workflow-run-read-blocked-reason";
import { rethrowLivelihoodMutate401 } from "@/lib/auth/livelihood-mutation-api-error";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { recordsOnly, trimOptionalText, trimRequiredPathSegment } from "./api-boundary-normalization";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { apiPostJson, type ApiGetOptions } from "./http";

const governanceBase = (): string => `/${ApiV1Routes.governance}`;

/** Joins an approval request to run summary, authority manifest/findings (when linked), and promotions. */
export async function getApprovalRequestLineage(
  approvalRequestId: string,
): Promise<GovernanceLineageResult> {
  const normalizedApprovalRequestId = trimRequiredPathSegment(approvalRequestId, "approvalRequestId");

  try {
    return await apiGetSealedManifestAware<GovernanceLineageResult>(
      `${governanceBase()}/approval-requests/${encodeURIComponent(normalizedApprovalRequestId)}/lineage`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceApprovalLineageBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Deterministic governance rationale (lineage-derived bullets; no LLM). */
export async function getGovernanceApprovalRationale(
  approvalRequestId: string,
): Promise<GovernanceRationaleResult> {
  const normalizedApprovalRequestId = trimRequiredPathSegment(approvalRequestId, "approvalRequestId");

  try {
    return await apiGetSealedManifestAware<GovernanceRationaleResult>(
      `${governanceBase()}/approval-requests/${encodeURIComponent(normalizedApprovalRequestId)}/rationale`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceApprovalLineageBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Lists approval requests for a run (approval workflow). */
export async function listApprovalRequests(
  runId: string,
  options?: Pick<ApiGetOptions, "showErrorToast">,
): Promise<GovernanceApprovalRequest[]> {
  const normalizedRunId = trimRequiredPathSegment(runId, "runId");

  if (shouldSkipLiveAuthorityRunScopedApi(runId)) {
    return [];
  }

  try {
    return recordsOnly<GovernanceApprovalRequest>(await apiGetSealedManifestAware<unknown>(
      `${governanceBase()}/runs/${encodeURIComponent(normalizedRunId)}/approval-requests`,
      options,
    ));
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceWorkflowRunReadBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Submits a new approval request for manifest promotion between environments. */
export async function submitApprovalRequest(body: {
  runId: string;
  manifestVersion: string;
  sourceEnvironment: string;
  targetEnvironment: string;
  requestComment?: string;
}): Promise<GovernanceApprovalRequest> {
  const request = {
    ...body,
    runId: trimRequiredPathSegment(body.runId, "runId"),
    manifestVersion: trimRequiredPathSegment(body.manifestVersion, "manifestVersion"),
    sourceEnvironment: trimRequiredPathSegment(body.sourceEnvironment, "sourceEnvironment"),
    targetEnvironment: trimRequiredPathSegment(body.targetEnvironment, "targetEnvironment"),
    requestComment: trimOptionalText(body.requestComment),
  };

  try {
    return await apiPostJson<GovernanceApprovalRequest>(`${governanceBase()}/approval-requests`, request);
  } catch (error: unknown) {
    rethrowLivelihoodMutate401(error);
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceWorkflowMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Approves a pending approval request. */
export async function approveRequest(
  approvalRequestId: string,
  body: { reviewedBy?: string; reviewComment?: string },
): Promise<GovernanceApprovalRequest> {
  const normalizedApprovalRequestId = trimRequiredPathSegment(approvalRequestId, "approvalRequestId");
  const request = {
    reviewedBy: trimOptionalText(body.reviewedBy),
    reviewComment: trimOptionalText(body.reviewComment),
  };

  try {
    return await apiPostJson<GovernanceApprovalRequest>(
      `${governanceBase()}/approval-requests/${encodeURIComponent(normalizedApprovalRequestId)}/approve`,
      request,
    );
  } catch (error: unknown) {
    rethrowLivelihoodMutate401(error);
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceWorkflowMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Rejects a pending approval request. */
export async function rejectRequest(
  approvalRequestId: string,
  body: { reviewedBy?: string; reviewComment?: string },
): Promise<GovernanceApprovalRequest> {
  const normalizedApprovalRequestId = trimRequiredPathSegment(approvalRequestId, "approvalRequestId");
  const request = {
    reviewedBy: trimOptionalText(body.reviewedBy),
    reviewComment: trimOptionalText(body.reviewComment),
  };

  try {
    return await apiPostJson<GovernanceApprovalRequest>(
      `${governanceBase()}/approval-requests/${encodeURIComponent(normalizedApprovalRequestId)}/reject`,
      request,
    );
  } catch (error: unknown) {
    rethrowLivelihoodMutate401(error);
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceWorkflowMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Batch approve/reject many approval requests (ExecuteAuthority — partial success per id). */
export async function batchReviewGovernanceApprovalRequests(body: {
  approvalRequestIds: string[];
  decision: "approve" | "reject";
  reviewComment?: string;
  reviewedBy?: string;
}): Promise<GovernanceBatchReviewResponse> {
  const approvalRequestIds = body.approvalRequestIds
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  try {
    return await apiPostJson<GovernanceBatchReviewResponse>(`${governanceBase()}/approval-requests/batch-review`, {
      approvalRequestIds,
      decision: body.decision,
      reviewComment: trimOptionalText(body.reviewComment),
      reviewedBy: trimOptionalText(body.reviewedBy),
    });
  } catch (error: unknown) {
    rethrowLivelihoodMutate401(error);
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceWorkflowMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Records promotion of a manifest from source to target environment (after approval when required). */
export async function promoteManifest(body: {
  runId: string;
  manifestVersion: string;
  sourceEnvironment: string;
  targetEnvironment: string;
  promotedBy: string;
  approvalRequestId?: string;
  notes?: string;
}): Promise<GovernancePromotionRecord> {
  const request = {
    ...body,
    runId: trimRequiredPathSegment(body.runId, "runId"),
    manifestVersion: trimRequiredPathSegment(body.manifestVersion, "manifestVersion"),
    sourceEnvironment: trimRequiredPathSegment(body.sourceEnvironment, "sourceEnvironment"),
    targetEnvironment: trimRequiredPathSegment(body.targetEnvironment, "targetEnvironment"),
    promotedBy: trimRequiredPathSegment(body.promotedBy, "promotedBy"),
    approvalRequestId: trimOptionalText(body.approvalRequestId),
    notes: trimOptionalText(body.notes),
  };

  try {
    return await apiPostJson<GovernancePromotionRecord>(`${governanceBase()}/promotions`, request);
  } catch (error: unknown) {
    rethrowLivelihoodMutate401(error);
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceWorkflowMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Lists promotion audit rows for a run. */
export async function listPromotions(runId: string): Promise<GovernancePromotionRecord[]> {
  const normalizedRunId = trimRequiredPathSegment(runId, "runId");

  if (shouldSkipLiveAuthorityRunScopedApi(runId)) {
    return [];
  }

  try {
    return recordsOnly<GovernancePromotionRecord>(await apiGetSealedManifestAware<unknown>(
      `${governanceBase()}/runs/${encodeURIComponent(normalizedRunId)}/promotions`,
    ));
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceWorkflowRunReadBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
