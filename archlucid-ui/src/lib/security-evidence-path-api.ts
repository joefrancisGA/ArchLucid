import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";
import type {
  OperationalSecurityFindingDetail,
  SecurityEvidencePathAttackPathReport,
  SecurityEvidencePathCutPoint,
  SecurityEvidencePathDetail,
  SecurityEvidencePathExplanation,
  SecurityEvidencePathExplanationResult,
  SecurityEvidencePathExplanationTemplate,
  SecurityEvidencePathHop,
  SecurityEvidencePathRankDetail,
  SecurityEvidencePathRankedPage,
  SecurityEvidencePathRankSummary,
  SecurityEvidencePathReportUnevaluatedGroup,
  SecurityEvidencePathRoutingRow,
  SecurityEvidencePathWeakestHop,
} from "@/lib/security-evidence-path-types";

const FINDINGS_PATH = "/api/proxy/v1/operational-security/findings";
const PATHS_PATH = "/api/proxy/v1/operational-security/paths";

function finiteNumberOrDefault(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function finiteNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapStoredLabel(value: unknown, omissionLabel: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return omissionLabel;
  }

  return value;
}

function mapHop(raw: Record<string, unknown>): SecurityEvidencePathHop {
  return {
    hopOrdinal: finiteNumberOrNull(raw.hopOrdinal),
    fromNodeLabel: mapStoredLabel(raw.fromNodeLabel, "Hop source was not stored."),
    toNodeLabel: mapStoredLabel(raw.toNodeLabel, "Hop destination was not stored."),
    edgeType: mapStoredLabel(raw.edgeType, "Relationship type was not stored"),
    provenanceKind: String(raw.provenanceKind ?? ""),
    hopConfidenceBand: String(raw.hopConfidenceBand ?? ""),
    inferenceSource: raw.inferenceSource != null ? String(raw.inferenceSource) : null,
    evidenceReference: String(raw.evidenceReference ?? ""),
    cloudResourceId: raw.cloudResourceId != null ? String(raw.cloudResourceId) : null,
  };
}

function mapWeakestHop(raw: Record<string, unknown>): SecurityEvidencePathWeakestHop {
  return {
    hopOrdinal: finiteNumberOrNull(raw.hopOrdinal),
    edgeType: mapStoredLabel(raw.edgeType, "Relationship type was not stored"),
    hopConfidenceBand: String(raw.hopConfidenceBand ?? ""),
    provenanceKind: String(raw.provenanceKind ?? ""),
    reason: String(raw.reason ?? ""),
  };
}

function mapExplanationTemplate(raw: Record<string, unknown> | null | undefined): SecurityEvidencePathExplanationTemplate | null {
  if (raw == null) {
    return null;
  }

  return {
    actor: raw.actor != null ? String(raw.actor) : null,
    identity: raw.identity != null ? String(raw.identity) : null,
    network: raw.network != null ? String(raw.network) : null,
    asset: raw.asset != null ? String(raw.asset) : null,
    weakControl: raw.weakControl != null ? String(raw.weakControl) : null,
    proposedChange: raw.proposedChange != null ? String(raw.proposedChange) : null,
    verify: raw.verify != null ? String(raw.verify) : null,
    architectSentence: raw.architectSentence != null ? String(raw.architectSentence) : null,
  };
}

function mapCutPoint(raw: Record<string, unknown>): SecurityEvidencePathCutPoint {
  const collapsedPathIdsRaw = Array.isArray(raw.collapsedPathIds) ? raw.collapsedPathIds : [];
  const leverageRaw = raw.leverageScore;

  return {
    cutPointId: String(raw.cutPointId ?? ""),
    cutKind: String(raw.cutKind ?? ""),
    cutOrder: Number(raw.cutOrder ?? 0),
    fromNodeLabel: raw.fromNodeLabel != null ? String(raw.fromNodeLabel) : null,
    toNodeLabel: raw.toNodeLabel != null ? String(raw.toNodeLabel) : null,
    edgeType: raw.edgeType != null ? String(raw.edgeType) : null,
    explanationSummary: String(raw.explanationSummary ?? ""),
    suggestedPatternKey: raw.suggestedPatternKey != null ? String(raw.suggestedPatternKey) : null,
    operationalCostClass: String(raw.operationalCostClass ?? ""),
    pathsCollapsedCount: finiteNumberOrDefault(raw.pathsCollapsedCount, 0),
    leverageScore: finiteNumberOrNull(leverageRaw),
    collapsedPathIds: collapsedPathIdsRaw.map((id) => String(id)),
  };
}

function mapRankSummary(raw: Record<string, unknown>): SecurityEvidencePathRankSummary {
  const cutPointsRaw = Array.isArray(raw.relatedCutPoints) ? raw.relatedCutPoints : [];

  return {
    pathId: String(raw.pathId ?? ""),
    snapshotId: String(raw.snapshotId ?? ""),
    rankOrder: finiteNumberOrNull(raw.rankOrder),
    ruleVersion: String(raw.ruleVersion ?? ""),
    technicalExposureScore: finiteNumberOrNull(raw.technicalExposureScore),
    privilegeDepthScore: finiteNumberOrNull(raw.privilegeDepthScore),
    blastRadiusScore: finiteNumberOrNull(raw.blastRadiusScore),
    businessConsequenceScore: finiteNumberOrNull(raw.businessConsequenceScore),
    confidenceBandScore: finiteNumberOrNull(raw.confidenceBandScore),
    compositeSortScore: finiteNumberOrNull(raw.compositeSortScore),
    explanationSummary: String(raw.explanationSummary ?? ""),
    pathKind: String(raw.pathKind ?? ""),
    pathConfidenceBand: String(raw.pathConfidenceBand ?? ""),
    computedUtc: String(raw.computedUtc ?? ""),
    relatedCutPoints: cutPointsRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map(mapCutPoint),
  };
}

function mapRankDetail(raw: Record<string, unknown>): SecurityEvidencePathRankDetail {
  const dimensionProseRaw = raw.dimensionProse as Record<string, unknown> | null | undefined;

  return {
    pathId: String(raw.pathId ?? ""),
    snapshotId: String(raw.snapshotId ?? ""),
    rankOrder: finiteNumberOrNull(raw.rankOrder),
    ruleVersion: String(raw.ruleVersion ?? ""),
    technicalExposureScore: finiteNumberOrNull(raw.technicalExposureScore),
    privilegeDepthScore: finiteNumberOrNull(raw.privilegeDepthScore),
    blastRadiusScore: finiteNumberOrNull(raw.blastRadiusScore),
    businessConsequenceScore: finiteNumberOrNull(raw.businessConsequenceScore),
    confidenceBandScore: finiteNumberOrNull(raw.confidenceBandScore),
    compositeSortScore: finiteNumberOrNull(raw.compositeSortScore),
    explanationSummary: String(raw.explanationSummary ?? ""),
    breakdownJson: String(raw.breakdownJson ?? ""),
    pathKind: String(raw.pathKind ?? ""),
    pathConfidenceBand: String(raw.pathConfidenceBand ?? ""),
    dimensionProse: {
      technicalExposure: mapStoredLabel(
        dimensionProseRaw?.technicalExposure,
        "Technical exposure prose was not stored.",
      ),
      privilegeDepth: mapStoredLabel(
        dimensionProseRaw?.privilegeDepth,
        "Privilege depth prose was not stored.",
      ),
      blastRadius: mapStoredLabel(dimensionProseRaw?.blastRadius, "Blast radius prose was not stored."),
      businessConsequence: mapStoredLabel(
        dimensionProseRaw?.businessConsequence,
        "Business consequence prose was not stored.",
      ),
      confidenceBand: mapStoredLabel(
        dimensionProseRaw?.confidenceBand,
        "Confidence band prose was not stored.",
      ),
      overall: mapStoredLabel(dimensionProseRaw?.overall, "Overall rank prose was not stored."),
    },
    computedUtc: String(raw.computedUtc ?? ""),
  };
}

function mapExplanation(raw: Record<string, unknown>): SecurityEvidencePathExplanation {
  const proposedRemediationRaw = raw.proposedRemediation as Record<string, unknown> | null | undefined;
  const hypothesesRaw = Array.isArray(raw.businessImpactHypotheses) ? raw.businessImpactHypotheses : [];
  const citedRefsRaw = Array.isArray(raw.citedEvidenceRefs) ? raw.citedEvidenceRefs : [];
  const verificationQueriesRaw = Array.isArray(proposedRemediationRaw?.verificationQueries)
    ? proposedRemediationRaw.verificationQueries
    : [];
  const preconditionsRaw = Array.isArray(proposedRemediationRaw?.preconditions)
    ? proposedRemediationRaw.preconditions
    : [];

  return {
    explanationId: String(raw.explanationId ?? ""),
    pathId: String(raw.pathId ?? ""),
    executiveSummary: String(raw.executiveSummary ?? ""),
    businessImpactHypotheses: hypothesesRaw.map((item) => String(item)),
    proposedRemediation: {
      recommendedChange: String(proposedRemediationRaw?.recommendedChange ?? ""),
      recommendedChangeSource: String(proposedRemediationRaw?.recommendedChangeSource ?? ""),
      verificationQueries: verificationQueriesRaw.map((item) => String(item)),
      preconditions: preconditionsRaw.map((item) => String(item)),
      suggestedPatternKey:
        proposedRemediationRaw?.suggestedPatternKey != null
          ? String(proposedRemediationRaw.suggestedPatternKey)
          : null,
    },
    citedEvidenceRefs: citedRefsRaw.map((item) => String(item)),
    provenanceKind: String(raw.provenanceKind ?? ""),
    simulatorLabel: raw.simulatorLabel != null ? String(raw.simulatorLabel) : null,
    createdUtc: String(raw.createdUtc ?? ""),
  };
}

function mapRouting(raw: Record<string, unknown>): SecurityEvidencePathRoutingRow {
  return {
    role: String(raw.role ?? ""),
    principalId: raw.principalId != null ? String(raw.principalId) : null,
    displayName: raw.displayName != null ? String(raw.displayName) : null,
    provenanceKind: String(raw.provenanceKind ?? ""),
    sourceReference: String(raw.sourceReference ?? ""),
  };
}

export async function fetchOperationalSecurityFindingDetail(
  findingId: string,
): Promise<OperationalSecurityFindingDetail | null> {
  const raw = await proxyJsonGet<Record<string, unknown>>(`${FINDINGS_PATH}/${findingId.trim()}`);

  if (raw.succeeded !== true) {
    return null;
  }

  const findingRaw = raw.finding as Record<string, unknown> | null | undefined;

  if (findingRaw == null) {
    return null;
  }

  return {
    findingId: String(findingRaw.findingId ?? findingId),
    pathId: findingRaw.pathId != null ? String(findingRaw.pathId) : null,
    title: findingRaw.title != null ? String(findingRaw.title) : null,
  };
}

function mapUnevaluatedGroup(raw: Record<string, unknown>): SecurityEvidencePathReportUnevaluatedGroup {
  const pathIdsRaw = Array.isArray(raw.pathIds) ? raw.pathIds : [];

  return {
    reasonCode: String(raw.reasonCode ?? ""),
    whyText: String(raw.whyText ?? ""),
    pathCount: raw.pathCount == null ? null : finiteNumberOrNull(raw.pathCount),
    pathIds: pathIdsRaw.map((item) => String(item)),
    engineName: raw.engineName != null ? String(raw.engineName) : null,
    limitValue: raw.limitValue == null ? null : finiteNumberOrNull(raw.limitValue),
    pathsEmitted: raw.pathsEmitted == null ? null : finiteNumberOrNull(raw.pathsEmitted),
  };
}

export async function fetchSecurityEvidencePathAttackPathReport(
  snapshotId: string,
): Promise<SecurityEvidencePathAttackPathReport | null> {
  const trimmed = snapshotId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const query = new URLSearchParams({ snapshotId: trimmed });
  const raw = await proxyJsonGet<Record<string, unknown>>(`${PATHS_PATH}/report?${query.toString()}`);
  const mappedSnapshotId = String(raw.snapshotId ?? trimmed).trim();

  if (mappedSnapshotId.length === 0) {
    return null;
  }

  const vulnerableRaw = Array.isArray(raw.vulnerableAttackPaths) ? raw.vulnerableAttackPaths : [];
  const unevaluatedRaw = Array.isArray(raw.unevaluatedGroups) ? raw.unevaluatedGroups : [];

  return {
    snapshotId: mappedSnapshotId,
    vulnerableAttackPaths: vulnerableRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map(mapRankSummary),
    unevaluatedGroups: unevaluatedRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map(mapUnevaluatedGroup),
  };
}

export async function fetchRankedSecurityEvidencePaths(
  page = 1,
  pageSize = 25,
): Promise<SecurityEvidencePathRankedPage> {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  const raw = await proxyJsonGet<Record<string, unknown>>(`${PATHS_PATH}/ranked?${query.toString()}`);
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const topCutPointsRaw = Array.isArray(raw.topCutPoints) ? raw.topCutPoints : [];

  return {
    items: itemsRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map(mapRankSummary),
    totalCount: finiteNumberOrDefault(raw.totalCount, 0),
    page: finiteNumberOrDefault(raw.page, page),
    pageSize: finiteNumberOrDefault(raw.pageSize, pageSize),
    topCutPoints: topCutPointsRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map(mapCutPoint),
  };
}

export async function fetchSecurityEvidencePathRank(pathId: string): Promise<SecurityEvidencePathRankDetail | null> {
  const raw = await proxyJsonGet<Record<string, unknown>>(`${PATHS_PATH}/${pathId.trim()}/rank`);
  const mappedPathId = String(raw.pathId ?? pathId).trim();

  if (mappedPathId.length === 0) {
    return null;
  }

  return mapRankDetail(raw);
}

export async function buildSecurityEvidencePathExplanation(
  pathId: string,
  options: {
    readonly useSimulator: boolean;
    readonly allowInsufficientEvidence: boolean;
  },
): Promise<SecurityEvidencePathExplanationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(`${PATHS_PATH}/${pathId.trim()}/explanations`, {
    useSimulator: options.useSimulator,
    allowInsufficientEvidence: options.allowInsufficientEvidence,
  });

  const explanationRaw = raw.explanation as Record<string, unknown> | null | undefined;

  return {
    succeeded: raw.succeeded === true,
    errorMessage: raw.errorMessage != null ? String(raw.errorMessage) : null,
    explanation: explanationRaw == null ? null : mapExplanation(explanationRaw),
  };
}

export async function fetchSecurityEvidencePathDetail(pathId: string): Promise<SecurityEvidencePathDetail | null> {
  const raw = await proxyJsonGet<Record<string, unknown>>(`${PATHS_PATH}/${pathId.trim()}`);
  const mappedPathId = String(raw.pathId ?? pathId).trim();

  if (mappedPathId.length === 0) {
    return null;
  }

  const hopsRaw = Array.isArray(raw.hops) ? raw.hops : [];
  const cutPointsRaw = Array.isArray(raw.relatedCutPoints) ? raw.relatedCutPoints : [];
  const routingRaw = Array.isArray(raw.routing) ? raw.routing : [];
  const weakestHopRaw = raw.weakestHop as Record<string, unknown> | null | undefined;
  const explanationTemplateRaw = raw.explanationTemplate as Record<string, unknown> | null | undefined;

  return {
    pathId: mappedPathId,
    snapshotId: String(raw.snapshotId ?? ""),
    pathKind: String(raw.pathKind ?? ""),
    pathConfidenceBand: String(raw.pathConfidenceBand ?? ""),
    weakestHopOrdinal: finiteNumberOrNull(raw.weakestHopOrdinal),
    weakestHopReason: String(raw.weakestHopReason ?? ""),
    hops: hopsRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map(mapHop),
    weakestHop: weakestHopRaw == null ? null : mapWeakestHop(weakestHopRaw),
    explanationTemplate: mapExplanationTemplate(explanationTemplateRaw),
    relatedCutPoints: cutPointsRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map(mapCutPoint),
    routing: routingRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map(mapRouting),
  };
}
