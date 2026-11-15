import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { DemoExplainResponse } from "@/types/demo-explain";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";
import type { TenantCostEstimateResponse } from "@/types/tenant-cost-estimate";
import { apiGet, ensureOidcBearerReady, resolveRequest, throwApiRequestError, withCorrelationHeaders } from "./http";
import { isRecord, normalizeCountFields, nonNegativeFiniteOrDefault } from "./api-boundary-normalization";

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

function mapWhyArchLucidSnapshot(raw: unknown): WhyArchLucidSnapshot {
  const row = isRecord(raw) ? raw : {};
  const findingsProducedBySeverity = isRecord(row.findingsProducedBySeverity)
    ? Object.fromEntries(
        Object.entries(row.findingsProducedBySeverity).map(([key, value]) => [key, nonNegativeFiniteOrDefault(value)]),
      )
    : {};

  return {
    generatedUtc: typeof row.generatedUtc === "string" ? row.generatedUtc : "",
    demoRunId: typeof row.demoRunId === "string" ? row.demoRunId.trim() : "",
    runsCreatedTotal: nonNegativeFiniteOrDefault(row.runsCreatedTotal),
    findingsProducedBySeverity,
    auditRowCount: nonNegativeFiniteOrDefault(row.auditRowCount),
    auditRowCountTruncated: row.auditRowCountTruncated === true,
    ...(typeof row.estimatedManualWorkHoursSaved === "number"
      ? { estimatedManualWorkHoursSaved: nonNegativeFiniteOrDefault(row.estimatedManualWorkHoursSaved) }
      : {}),
    ...(typeof row.estimatedManualWorkHoursSavedMethodology === "string"
      ? { estimatedManualWorkHoursSavedMethodology: row.estimatedManualWorkHoursSavedMethodology.trim() }
      : {}),
  };
}

function mapPilotScorecard(raw: unknown): PilotScorecardJson {
  return normalizeCountFields(raw) as PilotScorecardJson;
}

function mapSponsorEvidencePack(raw: unknown): SponsorEvidencePackPayload {
  return normalizeCountFields(raw) as SponsorEvidencePackPayload;
}

function mapDemoExplainResponse(raw: unknown): DemoExplainResponse | null {
  if (!isRecord(raw) || typeof raw.generatedUtc !== "string" || typeof raw.runId !== "string") {
    return null;
  }

  return raw as DemoExplainResponse;
}

/** GETs the `/v1/pilots/why-archlucid-snapshot` JSON snapshot used by the proof page. */
export async function getWhyArchLucidSnapshot(): Promise<WhyArchLucidSnapshot> {
  return mapWhyArchLucidSnapshot(await apiGet<unknown>("/v1/pilots/why-archlucid-snapshot"));
}

/** Bundle for `/why-archlucid`: process counters + optional monthly cost band + disclaimers. */
export type TenantMeasuredRoiPayload = {
  snapshot: WhyArchLucidSnapshot;
  monthlyCostEstimate: TenantCostEstimateResponse | null;
  disclaimer: string;
};

/** GET `/v1/pilots/scorecard` — committed-run aggregates and ROI baseline slots for the active tenant scope. */
export async function getPilotScorecard(options?: {
  readonly scopeHeaders?: Record<string, string>;
}): Promise<PilotScorecardJson> {
  return mapPilotScorecard(await apiGet<unknown>(`/${ApiV1Routes.pilotsScorecard}`, options));
}

/** GET `/v1/pilots/sponsor-evidence-pack` — aggregated sponsor-facing proof bundle (Standard tier). */
export async function getSponsorEvidencePack(): Promise<SponsorEvidencePackPayload> {
  return mapSponsorEvidencePack(await apiGet<unknown>(`/${ApiV1Routes.pilotsSponsorEvidencePack}`));
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
  roiSourceFreshnessDisposition?: string;
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
  const payload = await apiGet<unknown>(`/${ApiV1Routes.tenantMeasuredRoi}`);

  if (!isRecord(payload)) {
    throw new Error("Measured ROI response was not recognized.");
  }

  return {
    snapshot: mapWhyArchLucidSnapshot(payload.snapshot),
    monthlyCostEstimate: isRecord(payload.monthlyCostEstimate)
      ? (payload.monthlyCostEstimate as TenantCostEstimateResponse)
      : null,
    disclaimer: typeof payload.disclaimer === "string" ? payload.disclaimer : "",
  };
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
  const { url, headers } = await resolveRequest("/v1/demo/explain");
  const h = withCorrelationHeaders(headers);
  const response = await fetch(url, { cache: "no-store", headers: h });
  const text = await response.text();

  if (response.status === 404) return null;

  if (!response.ok) throwApiRequestError(response, text);

  const parsed: unknown = JSON.parse(text);

  return mapDemoExplainResponse(parsed);
}
