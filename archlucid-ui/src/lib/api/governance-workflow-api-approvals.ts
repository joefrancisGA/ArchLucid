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
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { apiPostJson, type ApiGetOptions } from "./http";

const governanceBase = (): string => `/${ApiV1Routes.governance}`;

/** Joins an approval request to run summary, authority manifest/findings (when linked), and promotions. */
export async function getApprovalRequestLineage(
  approvalRequestId: string,
): Promise<GovernanceLineageResult> {
  try {
    return await apiGetSealedManifestAware<GovernanceLineageResult>(
      `${governanceBase()}/approval-requests/${encodeURIComponent(approvalRequestId)}/lineage`,
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
  try {
    return await apiGetSealedManifestAware<GovernanceRationaleResult>(
      `${governanceBase()}/approval-requests/${encodeURIComponent(approvalRequestId)}/rationale`,
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
  options?: Pick<ApiGetOptions, "suppressErrorToast">,
): Promise<GovernanceApprovalRequest[]> {
  if (shouldSkipLiveAuthorityRunScopedApi(runId)) {
    return [];
  }

  try {
    return await apiGetSealedManifestAware<GovernanceApprovalRequest[]>(
      `${governanceBase()}/runs/${encodeURIComponent(runId)}/approval-requests`,
      options,
    );
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
  try {
    return await apiPostJson<GovernanceApprovalRequest>(`${governanceBase()}/approval-requests`, body);
  } catch (error: unknown) {
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
  try {
    return await apiPostJson<GovernanceApprovalRequest>(
      `${governanceBase()}/approval-requests/${encodeURIComponent(approvalRequestId)}/approve`,
      body,
    );
  } catch (error: unknown) {
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
  try {
    return await apiPostJson<GovernanceApprovalRequest>(
      `${governanceBase()}/approval-requests/${encodeURIComponent(approvalRequestId)}/reject`,
      body,
    );
  } catch (error: unknown) {
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
  try {
    return await apiPostJson<GovernanceBatchReviewResponse>(`${governanceBase()}/approval-requests/batch-review`, {
      approvalRequestIds: body.approvalRequestIds,
      decision: body.decision,
      reviewComment: body.reviewComment,
      reviewedBy: body.reviewedBy,
    });
  } catch (error: unknown) {
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
  try {
    return await apiPostJson<GovernancePromotionRecord>(`${governanceBase()}/promotions`, body);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceWorkflowMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Lists promotion audit rows for a run. */
export async function listPromotions(runId: string): Promise<GovernancePromotionRecord[]> {
  if (shouldSkipLiveAuthorityRunScopedApi(runId)) {
    return [];
  }

  try {
    return await apiGetSealedManifestAware<GovernancePromotionRecord[]>(
      `${governanceBase()}/runs/${encodeURIComponent(runId)}/promotions`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceWorkflowRunReadBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
