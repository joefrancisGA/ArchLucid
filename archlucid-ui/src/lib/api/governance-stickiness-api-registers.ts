import { formatExportSealedManifestAwareApiError } from "./export-sealed-manifest-conflict";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { apiGet } from "./http";
import { governanceAssignedToMeCountBlockedReason } from "@/lib/governance/governance-assigned-to-me-count-blocked-reason";
import { governancePostureBlockedReason } from "@/lib/governance/governance-posture-blocked-reason";
import {
  decisionsNeededSummaryBlockedReason,
  reviewsAwaitingActionBlockedReason,
} from "@/lib/governance/governance-stickiness-register-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  finiteNumberOrUndefined,
  normalizeCountFields,
  nonNegativeFiniteOrDefault,
  positiveIntegerOrDefault,
  trimOptionalText,
} from "./api-boundary-normalization";
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

  const projectId = trimOptionalText(options?.projectId);

  if (projectId !== undefined) {
    query.set("projectId", projectId);
  }

  if (options?.assignedToMe) {
    query.set("assignedToMe", "true");
  }

  if (options?.maxRows !== undefined) {
    query.set("maxRows", String(positiveIntegerOrDefault(options.maxRows, 100)));
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGetSealedManifestAware<ArchitectureRiskRegisterResponse>(
    `${governanceStickinessBase()}/risk-register${suffix}`,
  );
}

export async function getGovernanceAssignedToMeFindingsCount(
  projectId?: string,
): Promise<GovernanceAssignedToMeFindingsCountResponse> {
  const query = new URLSearchParams();

  const normalizedProjectId = trimOptionalText(projectId);

  if (normalizedProjectId !== undefined) {
    query.set("projectId", normalizedProjectId);
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  try {
    const payload = await apiGet<unknown>(
      `${governanceStickinessBase()}/risk-register/assigned-to-me-count${suffix}`,
    );

    return {
      count: nonNegativeFiniteOrDefault(
        payload !== null && typeof payload === "object" ? (payload as { count?: unknown }).count : undefined,
      ),
    };
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceAssignedToMeCountBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
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

  const normalizedProjectId = trimOptionalText(options?.projectId);

  if (normalizedProjectId !== undefined) {
    query.set("projectId", normalizedProjectId);
  }

  if (options?.maxRows !== undefined) {
    query.set("maxRows", String(positiveIntegerOrDefault(options.maxRows, 100)));
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return apiGetSealedManifestAware(`${governanceStickinessBase()}/findings-registers-bundle${suffix}`);
}

export async function getArchitectureDecisionRegister(
  projectId?: string,
  filters?: ArchitectureDecisionRegisterFilters,
): Promise<ArchitectureDecisionRegisterResponse> {
  const query = new URLSearchParams();
  const normalizedProjectId = trimOptionalText(projectId);
  const category = trimOptionalText(filters?.category);
  const recordedAfterUtc = trimOptionalText(filters?.recordedAfterUtc);
  const recordedBeforeUtc = trimOptionalText(filters?.recordedBeforeUtc);
  const buyerConfidenceSource = trimOptionalText(filters?.buyerConfidenceSource);
  const minConfidence = finiteNumberOrUndefined(filters?.minConfidence);
  const maxConfidence = finiteNumberOrUndefined(filters?.maxConfidence);

  if (normalizedProjectId !== undefined) query.set("projectId", normalizedProjectId);
  if (category !== undefined) query.set("category", category);
  if (recordedAfterUtc !== undefined) query.set("recordedAfterUtc", recordedAfterUtc);
  if (recordedBeforeUtc !== undefined) query.set("recordedBeforeUtc", recordedBeforeUtc);
  if (minConfidence !== undefined && minConfidence >= 0) query.set("minConfidence", String(minConfidence));
  if (maxConfidence !== undefined && maxConfidence >= 0) query.set("maxConfidence", String(maxConfidence));
  if (buyerConfidenceSource !== undefined) query.set("buyerConfidenceSource", buyerConfidenceSource);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGetSealedManifestAware<ArchitectureDecisionRegisterResponse>(
    `${governanceStickinessBase()}/decision-register${suffix}`,
  );
}

export async function getGovernanceReviewsAwaitingAction(): Promise<GovernanceReviewsAwaitingActionResponse> {
  try {
    return await apiGet<GovernanceReviewsAwaitingActionResponse>(
      `${governanceStickinessBase()}/reviews-awaiting-action`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = reviewsAwaitingActionBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function getGovernanceDecisionsNeededSummary(
  projectId?: string,
): Promise<GovernanceDecisionsNeededSummary> {
  const query = new URLSearchParams();
  const normalizedProjectId = trimOptionalText(projectId);

  if (normalizedProjectId !== undefined) query.set("projectId", normalizedProjectId);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  try {
    return await apiGet<GovernanceDecisionsNeededSummary>(
      `${governanceStickinessBase()}/decisions-needed-summary${suffix}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = decisionsNeededSummaryBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function getGovernancePosture(projectId?: string): Promise<ArchitecturePostureSummary> {
  const query = new URLSearchParams();
  if (projectId) query.set("projectId", projectId);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  try {
    const payload = await apiGet<unknown>(`${governanceStickinessBase()}/posture${suffix}`);

    const posture = normalizeCountFields(payload) as ArchitecturePostureSummary;
    const validExaminationStates = new Set(["Examined", "PartiallyExamined", "NotExamined", "Unavailable"]);

    return {
      ...posture,
      pillars: posture.pillars.map((pillar) => ({
        ...pillar,
        examination: {
          ...pillar.examination,
          state: validExaminationStates.has(pillar.examination.state)
            ? pillar.examination.state
            : "Unavailable",
        },
      })),
    };
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governancePostureBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
