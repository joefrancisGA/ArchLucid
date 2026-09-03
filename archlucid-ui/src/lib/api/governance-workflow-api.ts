import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";
import type {
  ComplianceDriftTrendPoint,
  GovernanceBatchReviewResponse,
  GovernanceDashboardSummary,
  GovernanceLineageResult,
  GovernanceRationaleResult,
} from "@/types/governance-dashboard";
import type {
  GovernanceApprovalRequest,
  GovernanceEnvironmentActivation,
  GovernancePromotionRecord,
} from "@/types/governance-workflow";
import { shouldSkipLiveAuthorityRunScopedApi } from "@/lib/operator-static-demo/run-scoped-live-api";
import type { EffectivePolicyPackSet } from "@/types/policy-packs";
import type { AlertRoutingSubscription } from "@/types/alert-routing";
import type {
  GovernanceEnvironmentCatalog,
  ReplaceGovernanceEnvironmentCatalogRequest,
} from "@/types/governance-environment-catalog";
import { apiGet, apiPostJson, apiPutJson, type ApiGetOptions } from "./http";

const governanceBase = (): string => `/${ApiV1Routes.governance}`;

/** Governance setup guide: effective policy packs and alert routing subscriptions. */
export async function fetchGovernanceSetupGuideBundle(): Promise<{
  effectivePolicyPacks: EffectivePolicyPackSet;
  alertRoutingSubscriptions: AlertRoutingSubscription[];
}> {
  return apiGet(`${governanceBase()}/setup-guide-bundle`);
}

/** Fetches the governance resolution result (merge decisions, conflicts, effective content). */
export async function getGovernanceResolution(): Promise<EffectiveGovernanceResolutionResult> {
  return apiGet<EffectiveGovernanceResolutionResult>(`/${ApiV1Routes.governanceResolution}`);
}

/** Cross-run governance dashboard: pending approvals, recent decisions, tenant policy change log. */
export async function getGovernanceDashboard(
  maxPending = 20,
  maxDecisions = 20,
  maxChanges = 20,
): Promise<GovernanceDashboardSummary> {
  const query = new URLSearchParams({
    maxPending: String(maxPending),
    maxDecisions: String(maxDecisions),
    maxChanges: String(maxChanges),
  });

  return apiGet<GovernanceDashboardSummary>(`${governanceBase()}/dashboard?${query.toString()}`);
}

/** Policy pack change activity buckets for the governance dashboard trend chart. */
export async function getComplianceDriftTrend(
  fromUtc: string,
  toUtc: string,
  bucketMinutes = 1440,
): Promise<ComplianceDriftTrendPoint[]> {
  const query = new URLSearchParams({
    fromUtc,
    toUtc,
    bucketMinutes: String(bucketMinutes),
  });

  return apiGet<ComplianceDriftTrendPoint[]>(
    `${governanceBase()}/compliance-drift-trend?${query.toString()}`,
  );
}

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

/** Submits a new governance approval request for manifest promotion between environments. */
export async function submitApprovalRequest(body: {
  runId: string;
  manifestVersion: string;
  sourceEnvironment: string;
  targetEnvironment: string;
  requestComment?: string;
}): Promise<GovernanceApprovalRequest> {
  return apiPostJson<GovernanceApprovalRequest>(`${governanceBase()}/approval-requests`, body);
}

/** Approves a pending governance approval request. */
export async function approveRequest(
  approvalRequestId: string,
  body: { reviewedBy?: string; reviewComment?: string },
): Promise<GovernanceApprovalRequest> {
  return apiPostJson<GovernanceApprovalRequest>(
    `${governanceBase()}/approval-requests/${encodeURIComponent(approvalRequestId)}/approve`,
    body,
  );
}

/** Rejects a pending governance approval request. */
export async function rejectRequest(
  approvalRequestId: string,
  body: { reviewedBy?: string; reviewComment?: string },
): Promise<GovernanceApprovalRequest> {
  return apiPostJson<GovernanceApprovalRequest>(
    `${governanceBase()}/approval-requests/${encodeURIComponent(approvalRequestId)}/reject`,
    body,
  );
}

/** Batch approve/reject many governance approval requests (ExecuteAuthority — partial success per id). */
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

/**
 * Activates a run/manifest as the baseline for an environment.
 * `activatedBy` is part of the UI contract for operator context; the API derives the actor from auth.
 */
export async function activateEnvironment(body: {
  runId: string;
  manifestVersion: string;
  environment: string;
  activatedBy: string;
}): Promise<GovernanceEnvironmentActivation> {
  void body.activatedBy;

  return apiPostJson<GovernanceEnvironmentActivation>(`${governanceBase()}/activations`, {
    runId: body.runId,
    manifestVersion: body.manifestVersion,
    environment: body.environment,
  });
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

/** Lists environment activation rows for a run. */
export async function listActivations(runId: string): Promise<GovernanceEnvironmentActivation[]> {
  if (shouldSkipLiveAuthorityRunScopedApi(runId)) {
    return [];
  }

  return apiGet<GovernanceEnvironmentActivation[]>(
    `${governanceBase()}/runs/${encodeURIComponent(runId)}/activations`,
  );
}

/** Returns the administrator-defined governance environment catalog for the current scope. */
export async function fetchGovernanceEnvironmentCatalog(): Promise<GovernanceEnvironmentCatalog> {
  return apiGet<GovernanceEnvironmentCatalog>(`${governanceBase()}/environment-catalog`);
}

/** Replaces the governance environment catalog and allowed transitions for the current scope. */
export async function replaceGovernanceEnvironmentCatalog(
  body: ReplaceGovernanceEnvironmentCatalogRequest,
): Promise<GovernanceEnvironmentCatalog> {
  return apiPutJson<GovernanceEnvironmentCatalog>(`${governanceBase()}/environment-catalog`, body);
}
