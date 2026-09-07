import { apiGet } from "./http";
import {
  type ArchitectureDecisionRegisterFilters,
  type ArchitectureDecisionRegisterResponse,
  type ArchitecturePostureSummary,
  type ArchitectureRiskRegisterQueryOptions,
  type ArchitectureRiskRegisterResponse,
  type GovernanceAssignedToMeFindingsCountResponse,
  type GovernanceDecisionsNeededSummary,
  type GovernanceReviewsAwaitingActionResponse,
  governanceStickinessBase,
} from "./governance-stickiness-api-types";

export async function getArchitectureRiskRegister(
  options?: ArchitectureRiskRegisterQueryOptions,
): Promise<ArchitectureRiskRegisterResponse> {
  const query = new URLSearchParams();

  if (options?.projectId) {
    query.set("projectId", options.projectId);
  }

  if (options?.assignedToMe) {
    query.set("assignedToMe", "true");
  }

  if (typeof options?.maxRows === "number") {
    query.set("maxRows", String(options.maxRows));
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet<ArchitectureRiskRegisterResponse>(`${governanceStickinessBase()}/risk-register${suffix}`);
}

export async function getGovernanceAssignedToMeFindingsCount(
  projectId?: string,
): Promise<GovernanceAssignedToMeFindingsCountResponse> {
  const query = new URLSearchParams();

  if (projectId) {
    query.set("projectId", projectId);
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet<GovernanceAssignedToMeFindingsCountResponse>(
    `${governanceStickinessBase()}/risk-register/assigned-to-me-count${suffix}`,
  );
}

/** Risk and decision registers for the policy findings queue. */
export async function fetchGovernanceFindingsRegistersBundle(options?: {
  projectId?: string;
  maxRows?: number;
}): Promise<{
  riskRegister: ArchitectureRiskRegisterResponse;
  decisionRegister: ArchitectureDecisionRegisterResponse;
}> {
  const query = new URLSearchParams();

  if (options?.projectId) {
    query.set("projectId", options.projectId);
  }

  if (typeof options?.maxRows === "number") {
    query.set("maxRows", String(options.maxRows));
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return apiGet(`${governanceStickinessBase()}/findings-registers-bundle${suffix}`);
}

export async function getArchitectureDecisionRegister(
  projectId?: string,
  filters?: ArchitectureDecisionRegisterFilters,
): Promise<ArchitectureDecisionRegisterResponse> {
  const query = new URLSearchParams();
  if (projectId) query.set("projectId", projectId);
  if (filters?.category) query.set("category", filters.category);
  if (filters?.recordedAfterUtc) query.set("recordedAfterUtc", filters.recordedAfterUtc);
  if (filters?.recordedBeforeUtc) query.set("recordedBeforeUtc", filters.recordedBeforeUtc);
  if (typeof filters?.minConfidence === "number") query.set("minConfidence", String(filters.minConfidence));
  if (typeof filters?.maxConfidence === "number") query.set("maxConfidence", String(filters.maxConfidence));
  if (filters?.buyerConfidenceSource) query.set("buyerConfidenceSource", filters.buyerConfidenceSource);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet<ArchitectureDecisionRegisterResponse>(`${governanceStickinessBase()}/decision-register${suffix}`);
}

export async function getGovernanceReviewsAwaitingAction(): Promise<GovernanceReviewsAwaitingActionResponse> {
  return apiGet<GovernanceReviewsAwaitingActionResponse>(`${governanceStickinessBase()}/reviews-awaiting-action`);
}

export async function getGovernanceDecisionsNeededSummary(
  projectId?: string,
): Promise<GovernanceDecisionsNeededSummary> {
  const query = new URLSearchParams();
  if (projectId) query.set("projectId", projectId);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet<GovernanceDecisionsNeededSummary>(`${governanceStickinessBase()}/decisions-needed-summary${suffix}`);
}

export async function getGovernancePosture(projectId?: string): Promise<ArchitecturePostureSummary> {
  const query = new URLSearchParams();
  if (projectId) query.set("projectId", projectId);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet(`${governanceStickinessBase()}/posture${suffix}`);
}
