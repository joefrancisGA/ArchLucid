import type {
  AlertActionLoopDto,
  OperatorStickinessSnapshotDto,
  TenantIntegrationsOperationsDto,
  WeeklyDigestHealthDto,
} from "@/types/operate-rhythm";
import { encodeRequiredPathSegment, recordsOnly, trimTextFields } from "./api-boundary-normalization";
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
  // detailJson is sent exactly as given; only the short text fields are trimmed.
  const normalizedRequest = trimTextFields(request, [
    "architectureRunId",
    "authorityRunId",
    "manifestVersion",
    "patternKey",
    "artifactHint",
    "commentShort",
  ]);

  await apiPostNoContent("/v1/product-learning/signals", normalizedRequest);
}

export type OperatorNextBestActionDto = {
  actionId: string;
  title: string;
  reason: string;
  href: string;
};

/** A malformed response shows as an empty list instead of failing the panel that renders it. */
export async function fetchOperatorNextBestActions(): Promise<OperatorNextBestActionDto[]> {
  return recordsOnly<OperatorNextBestActionDto>(await apiGet<unknown>("/v1/tenant/customer-success/next-actions"));
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

/** Async so that a blank alert id becomes a rejected promise, which callers already handle with `.catch`. */
export async function fetchAlertActionLoop(alertId: string): Promise<AlertActionLoopDto> {
  return apiGet<AlertActionLoopDto>(`/v1/alerts/${encodeRequiredPathSegment(alertId, "alertId")}/action-loop`);
}

export type CorePilotChecklistStepDto = {
  stepIndex: number;
  isCompleted: boolean;
  updatedUtc: string;
  updatedByUserId?: string | null;
};

export async function fetchCorePilotTeamChecklist(): Promise<CorePilotChecklistStepDto[]> {
  return recordsOnly<CorePilotChecklistStepDto>(await apiGet<unknown>("/v1/tenant/core-pilot-checklist"));
}

export async function putCorePilotTeamChecklistStep(stepIndex: number, isCompleted: boolean): Promise<void> {
  // The API stores the step as a whole-number index starting at 0, so anything else is rejected here.
  if (!Number.isInteger(stepIndex) || stepIndex < 0) {
    throw new Error("stepIndex must be a non-negative whole number.");
  }

  await apiPutNoContent("/v1/tenant/core-pilot-checklist", { stepIndex, isCompleted });
}

export type ProductFeedbackRequest = {
  score: number;
  comment?: string | null;
  runId?: string | null;
  findingRef?: string | null;
};

export async function submitProductFeedback(request: ProductFeedbackRequest): Promise<void> {
  // The score is sent as given: the API owns its allowed range, which includes -1 for thumbs down.
  const normalizedRequest = trimTextFields(request, ["comment", "runId", "findingRef"]);

  await apiPostNoContent("/v1/tenant/customer-success/product-feedback", normalizedRequest);
}
