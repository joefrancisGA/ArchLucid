import type {
  AlertActionLoopDto,
  OperatorStickinessSnapshotDto,
  TenantIntegrationsOperationsDto,
  WeeklyDigestHealthDto,
} from "@/types/operate-rhythm";
import { apiGet, apiPostNoContent, apiPutNoContent } from "./http";

export type ProductLearningDisposition = "Trusted" | "Rejected" | "Revised" | "NeedsFollowUp";

export type ProductLearningSignalRequest = {
  architectureRunId?: string;
  authorityRunId?: string;
  manifestVersion?: string;
  subjectType: "Finding" | "ManifestArtifact" | "RunOutput" | "ComparisonSummary" | "AdvisoryRecommendation" | "Other";
  disposition: ProductLearningDisposition;
  patternKey?: string;
  artifactHint?: string;
  commentShort?: string;
  detailJson?: string;
};

export async function submitProductLearningSignal(request: ProductLearningSignalRequest): Promise<void> {
  await apiPostNoContent("/v1/product-learning/signals", request);
}

export type OperatorNextBestActionDto = {
  actionId: string;
  title: string;
  reason: string;
  href: string;
};

export function fetchOperatorNextBestActions(): Promise<OperatorNextBestActionDto[]> {
  return apiGet<OperatorNextBestActionDto[]>("/v1/tenant/customer-success/next-actions");
}

export function fetchOperatorStickinessSnapshot(): Promise<OperatorStickinessSnapshotDto> {
  return apiGet<OperatorStickinessSnapshotDto>("/v1/tenant/customer-success/stickiness-snapshot");
}

export function fetchTenantIntegrationsOperations(): Promise<TenantIntegrationsOperationsDto> {
  return apiGet<TenantIntegrationsOperationsDto>("/v1/tenant/integrations/operations");
}

export function fetchWeeklyDigestHealth(): Promise<WeeklyDigestHealthDto> {
  return apiGet<WeeklyDigestHealthDto>("/v1/tenant/operate/weekly-digest-health");
}

export function fetchAlertActionLoop(alertId: string): Promise<AlertActionLoopDto> {
  return apiGet<AlertActionLoopDto>(`/v1/alerts/${encodeURIComponent(alertId)}/action-loop`);
}

export type CorePilotChecklistStepDto = {
  stepIndex: number;
  isCompleted: boolean;
  updatedUtc: string;
  updatedByUserId?: string | null;
};

export function fetchCorePilotTeamChecklist(): Promise<CorePilotChecklistStepDto[]> {
  return apiGet<CorePilotChecklistStepDto[]>("/v1/tenant/core-pilot-checklist");
}

export async function putCorePilotTeamChecklistStep(stepIndex: number, isCompleted: boolean): Promise<void> {
  await apiPutNoContent("/v1/tenant/core-pilot-checklist", { stepIndex, isCompleted });
}
