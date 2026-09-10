import { proxyJsonGet } from "@/lib/proxy-json-client";
import type {
  OperationalSecurityFindingDetail,
  SecurityEvidencePathCutPoint,
  SecurityEvidencePathDetail,
  SecurityEvidencePathExplanationTemplate,
  SecurityEvidencePathHop,
  SecurityEvidencePathRoutingRow,
  SecurityEvidencePathWeakestHop,
} from "@/lib/security-evidence-path-types";

const FINDINGS_PATH = "/api/proxy/v1/operational-security/findings";
const PATH_DETAIL_PATH = "/api/proxy/v1/operational-security/paths";

function mapHop(raw: Record<string, unknown>): SecurityEvidencePathHop {
  return {
    hopOrdinal: Number(raw.hopOrdinal ?? 0),
    fromNodeLabel: String(raw.fromNodeLabel ?? "—"),
    toNodeLabel: String(raw.toNodeLabel ?? "—"),
    edgeType: String(raw.edgeType ?? "—"),
    provenanceKind: String(raw.provenanceKind ?? ""),
    hopConfidenceBand: String(raw.hopConfidenceBand ?? ""),
    inferenceSource: raw.inferenceSource != null ? String(raw.inferenceSource) : null,
    evidenceReference: String(raw.evidenceReference ?? ""),
    cloudResourceId: raw.cloudResourceId != null ? String(raw.cloudResourceId) : null,
  };
}

function mapWeakestHop(raw: Record<string, unknown>): SecurityEvidencePathWeakestHop {
  return {
    hopOrdinal: Number(raw.hopOrdinal ?? 0),
    edgeType: String(raw.edgeType ?? "—"),
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

  if (!Boolean(raw.succeeded)) {
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

export async function fetchSecurityEvidencePathDetail(pathId: string): Promise<SecurityEvidencePathDetail | null> {
  const raw = await proxyJsonGet<Record<string, unknown>>(`${PATH_DETAIL_PATH}/${pathId.trim()}`);
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
    weakestHopOrdinal: Number(raw.weakestHopOrdinal ?? 0),
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
