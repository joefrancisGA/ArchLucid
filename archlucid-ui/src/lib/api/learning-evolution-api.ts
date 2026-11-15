import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { ImprovementPlan } from "@/types/advisory";
import type { LearningProfile } from "@/types/recommendation-learning";
import type { ProductLearningDashboardBundle } from "@/types/product-learning";
import type {
  LearningPlanDetailResponse,
  LearningPlansListResponse,
  LearningSummaryResponse,
  LearningThemesListResponse,
} from "@/types/learning";
import type {
  EvolutionCandidateChangeSetListResponse,
  EvolutionResultsResponse,
  EvolutionSimulateResponse,
} from "@/types/evolution";
import { apiPostJson, ensureOidcBearerReady, resolveRequest, throwApiRequestError, withCorrelationHeaders, type ApiGetOptions } from "./http";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { advisoryRunReadBlockedReason } from "@/lib/advisory/advisory-run-read-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  encodeRequiredPathSegment,
  isRecord,
  positiveIntegerOrDefault,
  trimOptionalText,
} from "./api-boundary-normalization";

/** Generates an AI-driven improvement plan for a run, optionally compared to another run. */
export async function getImprovementPlan(runId: string, compareToRunId?: string): Promise<ImprovementPlan> {
  const params = new URLSearchParams();
  const normalizedCompareToRunId = trimOptionalText(compareToRunId);

  if (normalizedCompareToRunId !== undefined) {
    params.set("compareToRunId", normalizedCompareToRunId);
  }

  const q = params.toString();

  try {
    return await apiGetSealedManifestAware<ImprovementPlan>(
      `/v1/advisory/runs/${encodeRequiredPathSegment(runId, "runId")}/improvements${q ? `?${q}` : ""}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = advisoryRunReadBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Fetches the most recent recommendation learning profile, or null if none exists (404). */
export async function getLatestLearningProfile(): Promise<LearningProfile | null> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest("/v1/recommendation-learning/latest");
  const h = withCorrelationHeaders(headers);
  const response = await fetch(url, { cache: "no-store", headers: h });
  const text = await response.text();

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throwApiRequestError(response, text);
  }

  const parsed: unknown = JSON.parse(text);

  if (!isRecord(parsed) || typeof parsed.generatedUtc !== "string") {
    throw new Error("Learning profile response was not recognized.");
  }

  return parsed as LearningProfile;
}

/** Optional `since` filter (ISO 8601) appended to product-learning GETs; omit for all-time scope. */
function productLearningSinceQuery(since: string | null | undefined): string {
  const trimmed = since?.trim();
  if (!trimmed) {
    return "";
  }

  return `?since=${encodeURIComponent(trimmed)}`;
}

/**
 * Loads summary, improvement opportunities, artifact outcome trends, and triage queue for the current scope.
 * Uses one dashboard rollup on the server instead of four parallel slice GETs.
 */
export async function fetchProductLearningDashboard(options?: {
  since?: string | null;
}): Promise<ProductLearningDashboardBundle> {
  const q = productLearningSinceQuery(options?.since);
  const base = `/${ApiV1Routes.productLearning}`;

  return apiGetSealedManifestAware<ProductLearningDashboardBundle>(`${base}/dashboard${q}`);
}

function learningMaxQuery(param: "maxThemes" | "maxPlans", value: number | undefined): string {
  if (value === undefined) {
    return "";
  }

  return `?${param}=${encodeURIComponent(String(positiveIntegerOrDefault(value, 20)))}`;
}

/** Lists improvement themes for the current scope (newest first). */
export async function fetchLearningThemes(maxThemes?: number): Promise<LearningThemesListResponse> {
  const q = learningMaxQuery("maxThemes", maxThemes);
  return apiGetSealedManifestAware<LearningThemesListResponse>(`/${ApiV1Routes.learning}/themes${q}`);
}

/** Lists improvement plans for the current scope (newest first). */
export async function fetchLearningPlans(
  maxPlans?: number,
  options?: { readonly signal?: AbortSignal },
): Promise<LearningPlansListResponse> {
  const q = learningMaxQuery("maxPlans", maxPlans);
  return apiGetSealedManifestAware<LearningPlansListResponse>(`/${ApiV1Routes.learning}/plans${q}`, options);
}

/** Loads one improvement plan with steps, link counts, and optional parent theme. */
export async function fetchLearningPlanDetail(planId: string): Promise<LearningPlanDetailResponse> {
  return apiGetSealedManifestAware<LearningPlanDetailResponse>(
    `/${ApiV1Routes.learning}/plans/${encodeRequiredPathSegment(planId, "planId")}`,
  );
}

/** Aggregated planning KPIs for the current scope. */
export async function fetchLearningSummary(options?: {
  maxThemes?: number;
  maxPlans?: number;
}): Promise<LearningSummaryResponse> {
  const params = new URLSearchParams();
  if (options?.maxThemes !== undefined) {
    params.set("maxThemes", String(positiveIntegerOrDefault(options.maxThemes, 20)));
  }

  if (options?.maxPlans !== undefined) {
    params.set("maxPlans", String(positiveIntegerOrDefault(options.maxPlans, 20)));
  }

  const q = params.toString();
  const suffix = q ? `?${q}` : "";

  return apiGetSealedManifestAware<LearningSummaryResponse>(`/${ApiV1Routes.learning}/summary${suffix}`);
}

/**
 * Loads summary, themes, and plans together (consistent refresh for the planning list view).
 */
export async function fetchLearningPlanningListBundle(options?: {
  maxThemes?: number;
  maxPlans?: number;
}): Promise<{
  summary: LearningSummaryResponse;
  themes: LearningThemesListResponse;
  plans: LearningPlansListResponse;
}> {
  const params = new URLSearchParams();
  if (options?.maxThemes !== undefined) {
    params.set("maxThemes", String(positiveIntegerOrDefault(options.maxThemes, 20)));
  }

  if (options?.maxPlans !== undefined) {
    params.set("maxPlans", String(positiveIntegerOrDefault(options.maxPlans, 20)));
  }

  const q = params.toString();
  const suffix = q ? `?${q}` : "";

  return apiGetSealedManifestAware(`/${ApiV1Routes.learning}/list-bundle${suffix}`);
}

/** Lists 60R evolution candidate change sets for the current scope (newest first server-side). */
export async function fetchEvolutionCandidates(max?: number): Promise<EvolutionCandidateChangeSetListResponse> {
  const q = max !== undefined ? `?max=${encodeURIComponent(String(positiveIntegerOrDefault(max, 20)))}` : "";

  return apiGetSealedManifestAware<EvolutionCandidateChangeSetListResponse>(`/${ApiV1Routes.evolution}/candidates${q}`);
}

/** Loads candidate, plan snapshot JSON, and simulation runs with parsed evaluation fields. */
export async function fetchEvolutionResults(candidateId: string): Promise<EvolutionResultsResponse> {
  return apiGetSealedManifestAware<EvolutionResultsResponse>(
    `/${ApiV1Routes.evolution}/results/${encodeRequiredPathSegment(candidateId, "candidateId")}`,
  );
}

/**
 * Re-runs simulation for the candidate (replaces prior rows). Requires operator access; may return 403.
 */
export async function postEvolutionSimulate(candidateId: string): Promise<EvolutionSimulateResponse> {
  return apiPostJson<EvolutionSimulateResponse>(
    `/${ApiV1Routes.evolution}/simulate/${encodeRequiredPathSegment(candidateId, "candidateId")}`,
    {},
  );
}
