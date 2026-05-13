import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { DemoExplainResponse } from "@/types/demo-explain";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";
import type { TenantCostEstimateResponse } from "@/types/tenant-cost-estimate";
import { apiGet, ensureOidcBearerReady, resolveRequest, throwApiRequestError, withCorrelationHeaders } from "./http";

/** Server-rendered telemetry snapshot for the operator-shell `/why-archlucid` proof page. */
export type WhyArchLucidSnapshot = {
  generatedUtc: string;
  demoRunId: string;
  runsCreatedTotal: number;
  findingsProducedBySeverity: Record<string, number>;
  auditRowCount: number;
  auditRowCountTruncated: boolean;
  /** Present on API builds that include planning-only ROI heuristic fields. */
  estimatedManualWorkHoursSaved?: number;
  /** Explains how {@link WhyArchLucidSnapshot.estimatedManualWorkHoursSaved} was computed. */
  estimatedManualWorkHoursSavedMethodology?: string;
};

/** GETs the `/v1/pilots/why-archlucid-snapshot` JSON snapshot used by the proof page. */
export async function getWhyArchLucidSnapshot(): Promise<WhyArchLucidSnapshot> {
  return apiGet<WhyArchLucidSnapshot>("/v1/pilots/why-archlucid-snapshot");
}

/** Bundle for `/why-archlucid`: process counters + optional monthly cost band + disclaimers. */
export type TenantMeasuredRoiPayload = {
  snapshot: WhyArchLucidSnapshot;
  monthlyCostEstimate: TenantCostEstimateResponse | null;
  disclaimer: string;
};

/** GET `/v1/pilots/scorecard` — committed-run aggregates and ROI baseline slots for the active tenant scope. */
export async function getPilotScorecard(): Promise<PilotScorecardJson> {
  return apiGet<PilotScorecardJson>(`/${ApiV1Routes.pilotsScorecard}`);
}

/** GET `/v1/pilots/sponsor-evidence-pack` — aggregated sponsor-facing proof bundle (Standard tier). */
export async function getSponsorEvidencePack(): Promise<SponsorEvidencePackPayload> {
  return apiGet<SponsorEvidencePackPayload>(
    `/${ApiV1Routes.pilotsSponsorEvidencePack}`,
  );
}

export type ExplainabilityTraceEngineCompletenessPack = {
  engineType: string;
  findingCount: number;
  completenessRatio: number;
  graphNodeIdsPopulatedCount: number;
  rulesAppliedPopulatedCount: number;
  decisionsTakenPopulatedCount: number;
  alternativePathsPopulatedCount: number;
  notesPopulatedCount: number;
};

export type ExplainabilityTraceCompletenessPack = {
  totalFindings: number;
  overallCompletenessRatio: number;
  byEngine: ExplainabilityTraceEngineCompletenessPack[];
};

export type SponsorEvidenceGovernanceOutcomesPack = {
  pendingApprovalCount: number;
  recentTerminalDecisionCount: number;
  recentPolicyPackChangeCount: number;
};

/** Proof-of-ROI slice for the demo run (camelCase JSON from PilotRunDeltasResponse). */
export type DemoRunPilotDeltaPack = {
  timeToCommittedManifestTotalSeconds?: number | null;
  manifestCommittedUtc?: string | null;
  runCreatedUtc: string;
  findingsBySeverity: { severity: string; count: number }[];
  auditRowCount: number;
  auditRowCountTruncated: boolean;
  llmCallCount: number;
  topFindingSeverity?: string | null;
  topFindingId?: string | null;
  topFindingEvidenceChain?: unknown | null;
  isDemoTenant: boolean;
};

export type SponsorEvidencePackPayload = {
  generatedUtc: string;
  demoRunId: string;
  processInstrumentation: WhyArchLucidSnapshot;
  explainabilityTrace: ExplainabilityTraceCompletenessPack;
  demoRunValueReportDelta?: DemoRunPilotDeltaPack | null;
  governanceOutcomes: SponsorEvidenceGovernanceOutcomesPack;
};

/** GETs `/v1/tenant/measured-roi` (operator proof page — combines snapshot + cost context). */
export async function getTenantMeasuredRoi(): Promise<TenantMeasuredRoiPayload> {
  return apiGet<TenantMeasuredRoiPayload>(`/${ApiV1Routes.tenantMeasuredRoi}`);
}

/**
 * GETs the side-by-side provenance + explanation payload used by the operator-shell
 * `/demo/explain` proof route. Returns `null` when the API responds 404 — that covers both
 * "demo seed has not been applied yet" and "deployment is not `Demo:Enabled=true`" (the
 * `[FeatureGate(DemoEnabled)]` filter on the server returns 404 by design so production-like
 * hosts cannot leak the demo surface). Callers should render a friendly fallback in either case.
 */
export async function getDemoExplain(): Promise<DemoExplainResponse | null> {
  await ensureOidcBearerReady();
  const { url, headers } = resolveRequest("/v1/demo/explain");
  const h = withCorrelationHeaders(headers);
  const response = await fetch(url, { cache: "no-store", headers: h });
  const text = await response.text();

  if (response.status === 404) return null;

  if (!response.ok) throwApiRequestError(response, text);

  return JSON.parse(text) as DemoExplainResponse;
}
