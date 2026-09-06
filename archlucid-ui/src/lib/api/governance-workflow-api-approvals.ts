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
import { apiGet, apiPostJson, type ApiGetOptions } from "./http";

const governanceBase = (): string => `/${ApiV1Routes.governance}`;

/** Joins an approval request to run summary, authority manifest/findings (when linked), and promotions. */
export async function getApprovalRequestLineage(
  approvalRequestId: string,
): Promise<GovernanceLineageResult> {
  return apiGet<GovernanceLineageResult>(
    `${governanceBase()}/approval-requests/${encodeURIComponent(approvalRequestId)}/lineage`,
  );
}

/** Deterministic governance rationale (lineage-derived bullets; no LLM). */
export async function getGovernanceApprovalRationale(
  approvalRequestId: string,
): Promise<GovernanceRationaleResult> {
  return apiGet<GovernanceRationaleResult>(
    `${governanceBase()}/approval-requests/${encodeURIComponent(approvalRequestId)}/rationale`,
  );
}

/** Lists approval requests for a run (governance workflow). */
export async function listApprovalRequests(
  runId: string,
  options?: Pick<ApiGetOptions, "suppressErrorToast">,
): Promise<GovernanceApprovalRequest[]> {
  if (shouldSkipLiveAuthorityRunScopedApi(runId)) {
    return [];
  }

  return apiGet<GovernanceApprovalRequest[]>(
    `${governanceBase()}/runs/${encodeURIComponent(runId)}/approval-requests`,
    options,
  );
}

/** Submits a new approval request for manifest promotion between environments. */
export async function submitApprovalRequest(body: {
  runId: string;
  manifestVersion: string;
  sourceEnvironment: string;
  targetEnvironment: string;
  requestComment?: string;
}): Promise<GovernanceApprovalRequest> {
  return apiPostJson<GovernanceApprovalRequest>(`${governanceBase()}/approval-requests`, body);
}

/** Approves a pending approval request. */
export async function approveRequest(
  approvalRequestId: string,
  body: { reviewedBy?: string; reviewComment?: string },
): Promise<GovernanceApprovalRequest> {
  return apiPostJson<GovernanceApprovalRequest>(
    `${governanceBase()}/approval-requests/${encodeURIComponent(approvalRequestId)}/approve`,
    body,
  );
}

/** Rejects a pending approval request. */
export async function rejectRequest(
  approvalRequestId: string,
  body: { reviewedBy?: string; reviewComment?: string },
): Promise<GovernanceApprovalRequest> {
  return apiPostJson<GovernanceApprovalRequest>(
    `${governanceBase()}/approval-requests/${encodeURIComponent(approvalRequestId)}/reject`,
    body,
  );
}

/** Batch approve/reject many approval requests (ExecuteAuthority — partial success per id). */
export async function batchReviewGovernanceApprovalRequests(body: {
  approvalRequestIds: string[];
  decision: "approve" | "reject";
  reviewComment?: string;
  reviewedBy?: string;
}): Promise<GovernanceBatchReviewResponse> {
  return apiPostJson<GovernanceBatchReviewResponse>(`${governanceBase()}/approval-requests/batch-review`, {
    approvalRequestIds: body.approvalRequestIds,
    decision: body.decision,
    reviewComment: body.reviewComment,
    reviewedBy: body.reviewedBy,
  });
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
  return apiPostJson<GovernancePromotionRecord>(`${governanceBase()}/promotions`, body);
}

/** Lists promotion audit rows for a run. */
export async function listPromotions(runId: string): Promise<GovernancePromotionRecord[]> {
  if (shouldSkipLiveAuthorityRunScopedApi(runId)) {
    return [];
  }

  return apiGet<GovernancePromotionRecord[]>(
    `${governanceBase()}/runs/${encodeURIComponent(runId)}/promotions`,
  );
}
