import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";
import {
  finiteNonNegativeNumberOrDefault,
  parseFiniteNumber,
} from "@/lib/parse-finite-number";
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
import { SECURITY_EVIDENCE_PATH_CUT_KIND_NOT_STORED } from "@/lib/security-evidence-path-cut-point-presentation";
import {
  SECURITY_EVIDENCE_PATH_BLAST_RADIUS_PROSE_NOT_STORED,
  SECURITY_EVIDENCE_PATH_HOP_EVIDENCE_NOT_STORED,
  SECURITY_EVIDENCE_PATH_RELATIONSHIP_TYPE_NOT_STORED,
  SECURITY_EVIDENCE_PATH_COMPUTED_UTC_NOT_STORED,
  SECURITY_EVIDENCE_PATH_RECOMMENDED_CHANGE_NOT_STORED,
  SECURITY_EVIDENCE_PATH_WEAKEST_HOP_REASON_NOT_STORED,
} from "@/lib/security-evidence-path-types";

const SECURITY_EVIDENCE_PATH_EXECUTIVE_SUMMARY_NOT_STORED = "Executive summary was not stored." as const;
const SECURITY_EVIDENCE_PATH_RULE_VERSION_NOT_STORED = "Rule version was not stored." as const;

const FINDINGS_PATH = "/api/proxy/v1/operational-security/findings";
const PATHS_PATH = "/api/proxy/v1/operational-security/paths";

function finiteNumberOrNull(value: unknown): number | null {
  return parseFiniteNumber(value);
}

function nonNegativeNumberOrNull(value: unknown): number | null {
  const parsed = parseFiniteNumber(value);

  return parsed === null || parsed < 0 ? null : parsed;
}

function mapStoredLabel(value: unknown, omissionLabel: string): string {
  if (typeof value !== "string") {
    return omissionLabel;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : omissionLabel;
}

function mapRawCodeField(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function mapOptionalTrimmedString(value: unknown): string | null {
  if (value == null || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function mapStoredStringList(values: ReadonlyArray<unknown>): string[] {
  return values
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function mapStoredIdList(values: ReadonlyArray<unknown>): string[] {
  return values
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function mapResponsePathId(value: unknown, fallback: string): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  const fallbackTrimmed = fallback.trim();

  return fallbackTrimmed.length > 0 ? fallbackTrimmed : null;
}

function mapHop(raw: Record<string, unknown>): SecurityEvidencePathHop {
  return {
    hopOrdinal: nonNegativeNumberOrNull(raw.hopOrdinal),
    fromNodeLabel: mapStoredLabel(raw.fromNodeLabel, "Hop source was not stored."),
    toNodeLabel: mapStoredLabel(raw.toNodeLabel, "Hop destination was not stored."),
    edgeType: mapStoredLabel(raw.edgeType, SECURITY_EVIDENCE_PATH_RELATIONSHIP_TYPE_NOT_STORED),
    provenanceKind: mapRawCodeField(raw.provenanceKind),
    hopConfidenceBand: mapRawCodeField(raw.hopConfidenceBand),
    inferenceSource: mapOptionalTrimmedString(raw.inferenceSource),
    evidenceReference: mapStoredLabel(raw.evidenceReference, SECURITY_EVIDENCE_PATH_HOP_EVIDENCE_NOT_STORED),
    cloudResourceId: mapOptionalTrimmedString(raw.cloudResourceId),
  };
}

function mapWeakestHop(raw: Record<string, unknown>): SecurityEvidencePathWeakestHop {
  return {
    hopOrdinal: nonNegativeNumberOrNull(raw.hopOrdinal),
    edgeType: mapStoredLabel(raw.edgeType, SECURITY_EVIDENCE_PATH_RELATIONSHIP_TYPE_NOT_STORED),
    hopConfidenceBand: mapRawCodeField(raw.hopConfidenceBand),
    provenanceKind: mapRawCodeField(raw.provenanceKind),
    reason: mapStoredLabel(raw.reason, SECURITY_EVIDENCE_PATH_WEAKEST_HOP_REASON_NOT_STORED),
  };
}

function mapExplanationTemplate(raw: Record<string, unknown> | null | undefined): SecurityEvidencePathExplanationTemplate | null {
  if (raw == null) {
    return null;
  }

  return {
    actor: mapOptionalTrimmedString(raw.actor),
    identity: mapOptionalTrimmedString(raw.identity),
    network: mapOptionalTrimmedString(raw.network),
    asset: mapOptionalTrimmedString(raw.asset),
    weakControl: mapOptionalTrimmedString(raw.weakControl),
    proposedChange: mapOptionalTrimmedString(raw.proposedChange),
    verify: mapOptionalTrimmedString(raw.verify),
    architectSentence: mapOptionalTrimmedString(raw.architectSentence),
  };
}

function mapStoredUtc(value: unknown): string {
  const trimmed = typeof value === "string" ? value.trim() : "";

  if (trimmed.length === 0) {
    return SECURITY_EVIDENCE_PATH_COMPUTED_UTC_NOT_STORED;
  }

  if (Number.isNaN(Date.parse(trimmed))) {
    return SECURITY_EVIDENCE_PATH_COMPUTED_UTC_NOT_STORED;
  }

  return trimmed;
}

type SecurityEvidencePathRankCore = {
  pathId: string;
  snapshotId: string;
  rankOrder: number | null;
  ruleVersion: string;
  technicalExposureScore: number | null;
  privilegeDepthScore: number | null;
  blastRadiusScore: number | null;
  businessConsequenceScore: number | null;
  confidenceBandScore: number | null;
  compositeSortScore: number | null;
  explanationSummary: string;
  pathKind: string;
  pathConfidenceBand: string;
  computedUtc: string;
};

function mapRankCore(raw: Record<string, unknown>): SecurityEvidencePathRankCore {
  return {
    pathId: mapOptionalTrimmedString(raw.pathId) ?? "",
    snapshotId: mapOptionalTrimmedString(raw.snapshotId) ?? "",
    rankOrder: finiteNumberOrNull(raw.rankOrder),
    ruleVersion: mapStoredLabel(raw.ruleVersion, SECURITY_EVIDENCE_PATH_RULE_VERSION_NOT_STORED),
    technicalExposureScore: nonNegativeNumberOrNull(raw.technicalExposureScore),
    privilegeDepthScore: nonNegativeNumberOrNull(raw.privilegeDepthScore),
    blastRadiusScore: nonNegativeNumberOrNull(raw.blastRadiusScore),
    businessConsequenceScore: nonNegativeNumberOrNull(raw.businessConsequenceScore),
    confidenceBandScore: nonNegativeNumberOrNull(raw.confidenceBandScore),
    compositeSortScore: nonNegativeNumberOrNull(raw.compositeSortScore),
    explanationSummary: mapStoredLabel(raw.explanationSummary, "Rank explanation summary was not stored."),
    pathKind: mapRawCodeField(raw.pathKind),
    pathConfidenceBand: mapRawCodeField(raw.pathConfidenceBand),
    computedUtc: mapStoredUtc(raw.computedUtc),
  };
}

function mapCutPoint(raw: Record<string, unknown>): SecurityEvidencePathCutPoint {
  const collapsedPathIdsRaw = Array.isArray(raw.collapsedPathIds) ? raw.collapsedPathIds : [];
  const leverageRaw = raw.leverageScore;

  return {
    cutPointId: mapStoredLabel(raw.cutPointId, "Cut point id was not stored."),
    cutKind: mapStoredLabel(raw.cutKind, SECURITY_EVIDENCE_PATH_CUT_KIND_NOT_STORED),
    cutOrder: nonNegativeNumberOrNull(raw.cutOrder),
    fromNodeLabel: mapOptionalTrimmedString(raw.fromNodeLabel),
    toNodeLabel: mapOptionalTrimmedString(raw.toNodeLabel),
    edgeType: mapOptionalTrimmedString(raw.edgeType),
    explanationSummary: mapStoredLabel(raw.explanationSummary, "Cut point summary was not stored."),
    suggestedPatternKey: mapOptionalTrimmedString(raw.suggestedPatternKey),
    operationalCostClass: mapStoredLabel(raw.operationalCostClass, "Operational cost class was not stored."),
    pathsCollapsedCount: nonNegativeNumberOrNull(raw.pathsCollapsedCount),
    leverageScore: nonNegativeNumberOrNull(leverageRaw),
    collapsedPathIds: mapStoredIdList(collapsedPathIdsRaw),
  };
}

function mapRankSummary(raw: Record<string, unknown>): SecurityEvidencePathRankSummary {
  const cutPointsRaw = Array.isArray(raw.relatedCutPoints) ? raw.relatedCutPoints : [];

  return {
    ...mapRankCore(raw),
    relatedCutPoints: cutPointsRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map(mapCutPoint),
  };
}

function mapRankDetail(raw: Record<string, unknown>): SecurityEvidencePathRankDetail {
  const dimensionProseRaw = raw.dimensionProse as Record<string, unknown> | null | undefined;

  return {
    ...mapRankCore(raw),
    breakdownJson: mapStoredLabel(raw.breakdownJson, "Rank breakdown was not stored."),
    dimensionProse: {
      technicalExposure: mapStoredLabel(
        dimensionProseRaw?.technicalExposure,
        "Technical exposure prose was not stored.",
      ),
      privilegeDepth: mapStoredLabel(
        dimensionProseRaw?.privilegeDepth,
        "Privilege depth prose was not stored.",
      ),
      blastRadius: mapStoredLabel(
        dimensionProseRaw?.blastRadius,
        SECURITY_EVIDENCE_PATH_BLAST_RADIUS_PROSE_NOT_STORED,
      ),
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
    nextStoredPathRankContext: mapStoredLabel(
      raw.nextStoredPathRankContext,
      "Next stored path rank context was not stored.",
    ),
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
    explanationId: mapStoredLabel(raw.explanationId, "Explanation id was not stored."),
    pathId: mapOptionalTrimmedString(raw.pathId) ?? "",
    executiveSummary: mapStoredLabel(raw.executiveSummary, SECURITY_EVIDENCE_PATH_EXECUTIVE_SUMMARY_NOT_STORED),
    businessImpactHypotheses: mapStoredStringList(hypothesesRaw),
    proposedRemediation: {
      recommendedChange: mapStoredLabel(
        proposedRemediationRaw?.recommendedChange,
        SECURITY_EVIDENCE_PATH_RECOMMENDED_CHANGE_NOT_STORED,
      ),
      recommendedChangeSource: mapStoredLabel(
        proposedRemediationRaw?.recommendedChangeSource,
        "Recommended change source was not stored.",
      ),
      verificationQueries: mapStoredStringList(verificationQueriesRaw),
      preconditions: mapStoredStringList(preconditionsRaw),
      suggestedPatternKey: mapOptionalTrimmedString(proposedRemediationRaw?.suggestedPatternKey),
    },
    citedEvidenceRefs: mapStoredStringList(citedRefsRaw),
    provenanceKind: mapRawCodeField(raw.provenanceKind),
    simulatorLabel: mapOptionalTrimmedString(raw.simulatorLabel),
    modelOutputRejection: mapOptionalTrimmedString(raw.modelOutputRejection),
    createdUtc: mapStoredUtc(raw.createdUtc),
  };
}

function mapRouting(raw: Record<string, unknown>): SecurityEvidencePathRoutingRow {
  return {
    role: mapStoredLabel(raw.role, "Routing role was not stored."),
    principalId: mapOptionalTrimmedString(raw.principalId),
    displayName: mapOptionalTrimmedString(raw.displayName),
    provenanceKind: mapRawCodeField(raw.provenanceKind),
    sourceReference: mapStoredLabel(raw.sourceReference, "Routing source reference was not stored."),
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
    findingId: mapStoredLabel(findingRaw.findingId, findingId.trim()),
    pathId: mapOptionalTrimmedString(findingRaw.pathId),
    title: mapOptionalTrimmedString(findingRaw.title),
  };
}

function mapUnevaluatedGroup(raw: Record<string, unknown>): SecurityEvidencePathReportUnevaluatedGroup {
  const pathIdsRaw = Array.isArray(raw.pathIds) ? raw.pathIds : [];

  return {
    reasonCode: mapStoredLabel(raw.reasonCode, "Unevaluated reason was not stored."),
    whyText: mapStoredLabel(raw.whyText, "Unevaluated explanation was not stored."),
    pathCount: nonNegativeNumberOrNull(raw.pathCount),
    pathIds: mapStoredIdList(pathIdsRaw),
    engineName: mapOptionalTrimmedString(raw.engineName),
    limitValue: nonNegativeNumberOrNull(raw.limitValue),
    pathsEmitted: nonNegativeNumberOrNull(raw.pathsEmitted),
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

  if (raw.succeeded === false) {
    return null;
  }

  const mappedSnapshotId = mapOptionalTrimmedString(raw.snapshotId) ?? trimmed;

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

  if (raw.succeeded === false) {
    throw new Error("Ranked security evidence paths could not be loaded.");
  }

  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const topCutPointsRaw = Array.isArray(raw.topCutPoints) ? raw.topCutPoints : [];

  return {
    items: itemsRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map(mapRankSummary),
    totalCount: finiteNonNegativeNumberOrDefault(raw.totalCount, 0),
    page: finiteNonNegativeNumberOrDefault(raw.page, page),
    pageSize: finiteNonNegativeNumberOrDefault(raw.pageSize, pageSize),
    topCutPoints: topCutPointsRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map(mapCutPoint),
  };
}

export async function fetchSecurityEvidencePathRank(pathId: string): Promise<SecurityEvidencePathRankDetail | null> {
  const raw = await proxyJsonGet<Record<string, unknown>>(`${PATHS_PATH}/${pathId.trim()}/rank`);

  if (raw.succeeded === false) {
    return null;
  }

  const mappedPathId = mapResponsePathId(raw.pathId, pathId);

  if (mappedPathId == null) {
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
    errorMessage: mapOptionalTrimmedString(raw.errorMessage),
    explanation: explanationRaw == null ? null : mapExplanation(explanationRaw),
  };
}

export async function fetchSecurityEvidencePathDetail(pathId: string): Promise<SecurityEvidencePathDetail | null> {
  const raw = await proxyJsonGet<Record<string, unknown>>(`${PATHS_PATH}/${pathId.trim()}`);

  if (raw.succeeded === false) {
    return null;
  }

  const mappedPathId = mapResponsePathId(raw.pathId, pathId);

  if (mappedPathId == null) {
    return null;
  }

  const hopsRaw = Array.isArray(raw.hops) ? raw.hops : [];
  const cutPointsRaw = Array.isArray(raw.relatedCutPoints) ? raw.relatedCutPoints : [];
  const routingRaw = Array.isArray(raw.routing) ? raw.routing : [];
  const weakestHopRaw = raw.weakestHop as Record<string, unknown> | null | undefined;
  const explanationTemplateRaw = raw.explanationTemplate as Record<string, unknown> | null | undefined;

  return {
    pathId: mappedPathId,
    snapshotId: mapOptionalTrimmedString(raw.snapshotId) ?? "",
    pathKind: mapRawCodeField(raw.pathKind),
    pathConfidenceBand: mapRawCodeField(raw.pathConfidenceBand),
    weakestHopOrdinal: finiteNumberOrNull(raw.weakestHopOrdinal),
    weakestHopReason: mapStoredLabel(raw.weakestHopReason, SECURITY_EVIDENCE_PATH_WEAKEST_HOP_REASON_NOT_STORED),
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
