import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { components } from "@/lib/openapi-schemas";
import {
  POLICY_PACK_DRY_RUN_DEFAULT_PAGE_SIZE,
  POLICY_PACK_DRY_RUN_MAX_PAGE_SIZE,
  type PolicyPackDryRunRequest,
  type PolicyPackDryRunResponse,
} from "@/types/policy-pack-dry-run";
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
import type {
  EffectivePolicyPackSet,
  PolicyPack,
  PolicyPackAssignment,
  PolicyPackContentDocument,
  PolicyPackVersion,
} from "@/types/policy-packs";
import { apiGet, apiPostJson } from "./http";

export async function listPolicyPacks(): Promise<PolicyPack[]> {
  return apiGet<PolicyPack[]>(`/${ApiV1Routes.policyPacks}`);
}

/** Lists published versions for a policy pack. */
export async function listPolicyPackVersions(policyPackId: string): Promise<PolicyPackVersion[]> {
  return apiGet<PolicyPackVersion[]>(
    `/${ApiV1Routes.policyPacks}/${encodeURIComponent(policyPackId)}/versions`,
  );
}

/** Fetches the effective (resolved) set of policy packs for the current scope. */
export async function getEffectivePolicyPacks(): Promise<EffectivePolicyPackSet> {
  return apiGet<EffectivePolicyPackSet>(`/${ApiV1Routes.policyPacks}/effective`);
}

/** Fetches the merged content document from all effective policy packs. */
export async function getEffectivePolicyContent(): Promise<PolicyPackContentDocument> {
  return apiGet<PolicyPackContentDocument>(`/${ApiV1Routes.policyPacks}/effective-content`);
}

/** Fetches the governance resolution result (merge decisions, conflicts, effective content). */
export async function getGovernanceResolution(): Promise<EffectiveGovernanceResolutionResult> {
  return apiGet<EffectiveGovernanceResolutionResult>(`/${ApiV1Routes.governanceResolution}`);
}

const governanceBase = (): string => `/${ApiV1Routes.governance}`;

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
export async function listApprovalRequests(runId: string): Promise<GovernanceApprovalRequest[]> {
  return apiGet<GovernanceApprovalRequest[]>(
    `${governanceBase()}/runs/${encodeURIComponent(runId)}/approval-requests`,
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
 * `activatedBy` is part of the UI contract for operator context; the API derives the actor from auth and only reads runId, manifestVersion, environment from the JSON body.
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
  return apiGet<GovernancePromotionRecord[]>(
    `${governanceBase()}/runs/${encodeURIComponent(runId)}/promotions`,
  );
}

/** Lists environment activation rows for a run. */
export async function listActivations(runId: string): Promise<GovernanceEnvironmentActivation[]> {
  return apiGet<GovernanceEnvironmentActivation[]>(
    `${governanceBase()}/runs/${encodeURIComponent(runId)}/activations`,
  );
}

/** Creates a new policy pack with an initial content document. */
export async function createPolicyPack(body: {
  name: string;
  description?: string;
  packType: string;
  initialContentJson?: string;
}): Promise<PolicyPack> {
  return apiPostJson<PolicyPack>(`/${ApiV1Routes.policyPacks}`, body);
}

/** Publishes a new version of a policy pack with optional updated content. */
export async function publishPolicyPackVersion(
  policyPackId: string,
  body: { version: string; contentJson?: string },
): Promise<PolicyPackVersion> {
  return apiPostJson<PolicyPackVersion>(
    `/${ApiV1Routes.policyPacks}/${encodeURIComponent(policyPackId)}/publish`,
    body,
  );
}

/**
 * Dry-runs proposed threshold changes for a policy pack against a list of historic runs without
 * committing anything (POST `/v1/governance/policy-packs/{id}/dry-run`). The default page size is
 * fixed by `POLICY_PACK_DRY_RUN_DEFAULT_PAGE_SIZE` and clamped client-side to
 * `POLICY_PACK_DRY_RUN_MAX_PAGE_SIZE` per owner Q38 (the API will also clamp). The response always
 * carries a `proposedThresholdsRedactedJson` value that has been through the LLM-prompt redaction
 * pipeline (PENDING_QUESTIONS Q37) before persistence in the audit log.
 */
export async function dryRunPolicyPack(
  policyPackId: string,
  body: PolicyPackDryRunRequest,
  options?: { page?: number; pageSize?: number },
): Promise<PolicyPackDryRunResponse> {
  const pageSize = clampDryRunPageSize(options?.pageSize);
  const page = clampDryRunPage(options?.page);
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

  return apiPostJson<PolicyPackDryRunResponse>(
    `/${ApiV1Routes.policyPacks}/${encodeURIComponent(policyPackId)}/dry-run?${query.toString()}`,
    body,
  );
}

function clampDryRunPageSize(input: number | undefined): number {
  if (input === undefined || !Number.isFinite(input)) {
    return POLICY_PACK_DRY_RUN_DEFAULT_PAGE_SIZE;
  }

  if (input < 1) {
    return POLICY_PACK_DRY_RUN_DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.floor(input), POLICY_PACK_DRY_RUN_MAX_PAGE_SIZE);
}

function clampDryRunPage(input: number | undefined): number {
  if (input === undefined || !Number.isFinite(input) || input < 1) {
    return 1;
  }

  return Math.floor(input);
}

/** Assigns a specific policy pack version to the current scope (project/workspace/tenant). */
export async function assignPolicyPack(
  policyPackId: string,
  body: { version: string; scopeLevel?: string; isPinned?: boolean },
): Promise<PolicyPackAssignment> {
  return apiPostJson<PolicyPackAssignment>(
    `/${ApiV1Routes.policyPacks}/${encodeURIComponent(policyPackId)}/assign`,
    body,
  );
}

/**
 * Dry-runs proposed policy pack content against a single authority run (pre-commit gate semantics).
 * Matches {@code POST /v1/policy-packs/simulate}. Requires ReadAuthority.
 */
export async function simulatePolicyPackAgainstRun(
  body: components["schemas"]["PolicyPackSimulateRequest"],
): Promise<components["schemas"]["PolicyPackGovernanceDryRunResult"]> {
  return apiPostJson<components["schemas"]["PolicyPackGovernanceDryRunResult"]>(
    `/${ApiV1Routes.policyPacks}/simulate`,
    body,
  );
}
