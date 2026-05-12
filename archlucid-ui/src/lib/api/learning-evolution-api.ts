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
import { apiGet, apiPostJson, ensureOidcBearerReady, resolveRequest, throwApiRequestError, withCorrelationHeaders } from "./http";

/** Generates an AI-driven improvement plan for a run, optionally compared to another run. */
export async function getImprovementPlan(runId: string, compareToRunId?: string): Promise<ImprovementPlan> {
  const params = new URLSearchParams();
  if (compareToRunId?.trim()) params.set("compareToRunId", compareToRunId.trim());
  const q = params.toString();
  return apiGet<ImprovementPlan>(
    `/v1/advisory/runs/${encodeURIComponent(runId)}/improvements${q ? `?${q}` : ""}`,
  );
}

/** Fetches the most recent recommendation learning profile, or null if none exists (404). */
export async function getLatestLearningProfile(): Promise<LearningProfile | null> {
  await ensureOidcBearerReady();
  const { url, headers } = resolveRequest("/v1/recommendation-learning/latest");
  const h = withCorrelationHeaders(headers);
  const response = await fetch(url, { cache: "no-store", headers: h });
  const text = await response.text();

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throwApiRequestError(response, text);
  }

  return JSON.parse(text) as LearningProfile;
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
 * Each upstream call recomputes its slice; use one refresh action to keep the four panels consistent.
 */
export async function fetchProductLearningDashboard(options?: {
  since?: string | null;
}): Promise<ProductLearningDashboardBundle> {
  const q = productLearningSinceQuery(options?.since);
  const base = `/${ApiV1Routes.productLearning}`;

  const [summary, opportunities, trends, triage] = await Promise.all([
    apiGet(`${base}/summary${q}`),
    apiGet(`${base}/improvement-opportunities${q}`),
    apiGet(`${base}/artifact-outcome-trends${q}`),
    apiGet(`${base}/triage-queue${q}`),
  ]);

  return {
    summary: summary as ProductLearningDashboardBundle["summary"],
    opportunities: opportunities as ProductLearningDashboardBundle["opportunities"],
    trends: trends as ProductLearningDashboardBundle["trends"],
    triage: triage as ProductLearningDashboardBundle["triage"],
  };
}

function learningMaxQuery(param: "maxThemes" | "maxPlans", value: number | undefined): string {
  if (value === undefined) {
    return "";
  }

  return `?${param}=${encodeURIComponent(String(value))}`;
}

/** Lists improvement themes for the current scope (newest first). */
export async function fetchLearningThemes(maxThemes?: number): Promise<LearningThemesListResponse> {
  const q = learningMaxQuery("maxThemes", maxThemes);
  return apiGet<LearningThemesListResponse>(`/${ApiV1Routes.learning}/themes${q}`);
}

/** Lists improvement plans for the current scope (newest first). */
export async function fetchLearningPlans(maxPlans?: number): Promise<LearningPlansListResponse> {
  const q = learningMaxQuery("maxPlans", maxPlans);
  return apiGet<LearningPlansListResponse>(`/${ApiV1Routes.learning}/plans${q}`);
}

/** Loads one improvement plan with steps, link counts, and optional parent theme. */
export async function fetchLearningPlanDetail(planId: string): Promise<LearningPlanDetailResponse> {
  const id = planId.trim();
  return apiGet<LearningPlanDetailResponse>(`/${ApiV1Routes.learning}/plans/${encodeURIComponent(id)}`);
}

/** Aggregated planning KPIs for the current scope. */
export async function fetchLearningSummary(options?: {
  maxThemes?: number;
  maxPlans?: number;
}): Promise<LearningSummaryResponse> {
  const params = new URLSearchParams();
  if (options?.maxThemes !== undefined) {
    params.set("maxThemes", String(options.maxThemes));
  }
  if (options?.maxPlans !== undefined) {
    params.set("maxPlans", String(options.maxPlans));
  }

  const q = params.toString();
  const suffix = q ? `?${q}` : "";

  return apiGet<LearningSummaryResponse>(`/${ApiV1Routes.learning}/summary${suffix}`);
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
  const maxThemes = options?.maxThemes;
  const maxPlans = options?.maxPlans;

  const [summary, themes, plans] = await Promise.all([
    fetchLearningSummary({ maxThemes, maxPlans }),
    fetchLearningThemes(maxThemes),
    fetchLearningPlans(maxPlans),
  ]);

  return { summary, themes, plans };
}

/** Lists 60R evolution candidate change sets for the current scope (newest first server-side). */
export async function fetchEvolutionCandidates(max?: number): Promise<EvolutionCandidateChangeSetListResponse> {
  const q = max !== undefined ? `?max=${encodeURIComponent(String(max))}` : "";

  return apiGet<EvolutionCandidateChangeSetListResponse>(`/${ApiV1Routes.evolution}/candidates${q}`);
}

/** Loads candidate, plan snapshot JSON, and simulation runs with parsed evaluation fields. */
export async function fetchEvolutionResults(candidateId: string): Promise<EvolutionResultsResponse> {
  const id = candidateId.trim();

  return apiGet<EvolutionResultsResponse>(`/${ApiV1Routes.evolution}/results/${encodeURIComponent(id)}`);
}

/**
 * Re-runs simulation for the candidate (replaces prior rows). Requires operator access; may return 403.
 */
export async function postEvolutionSimulate(candidateId: string): Promise<EvolutionSimulateResponse> {
  const id = candidateId.trim();

  return apiPostJson<EvolutionSimulateResponse>(`/${ApiV1Routes.evolution}/simulate/${encodeURIComponent(id)}`, {});
}
