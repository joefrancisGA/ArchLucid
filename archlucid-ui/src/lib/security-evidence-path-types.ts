export type SecurityEvidencePathHop = {
  hopOrdinal: number | null;
  fromNodeLabel: string;
  toNodeLabel: string;
  edgeType: string;
  provenanceKind: string;
  hopConfidenceBand: string;
  inferenceSource: string | null;
  evidenceReference: string;
  cloudResourceId: string | null;
};

export const SECURITY_EVIDENCE_PATH_NODE_NAME_NOT_STORED = "Node name was not stored." as const;

export function securityEvidencePathHopNodeName(label: string): string {
  const trimmed = label.trim();

  if (trimmed.length === 0) {
    return SECURITY_EVIDENCE_PATH_NODE_NAME_NOT_STORED;
  }

  const lastSegment = trimmed.split("/").filter((segment) => segment.length > 0).at(-1);

  return lastSegment ?? trimmed;
}

export type SecurityEvidencePathWeakestHop = {
  hopOrdinal: number | null;
  edgeType: string;
  hopConfidenceBand: string;
  provenanceKind: string;
  reason: string;
};

export type SecurityEvidencePathCutPoint = {
  cutPointId: string;
  cutKind: string;
  cutOrder: number;
  fromNodeLabel: string | null;
  toNodeLabel: string | null;
  edgeType: string | null;
  explanationSummary: string;
  suggestedPatternKey: string | null;
  operationalCostClass: string;
  pathsCollapsedCount: number;
  leverageScore: number | null;
  collapsedPathIds: ReadonlyArray<string>;
};

export type SecurityEvidencePathRoutingRow = {
  role: string;
  principalId: string | null;
  displayName: string | null;
  provenanceKind: string;
  sourceReference: string;
};

export type SecurityEvidencePathExplanationTemplate = {
  actor: string | null;
  identity: string | null;
  network: string | null;
  asset: string | null;
  weakControl: string | null;
  proposedChange: string | null;
  verify: string | null;
  architectSentence: string | null;
};

export type SecurityEvidencePathDetail = {
  pathId: string;
  snapshotId: string;
  pathKind: string;
  pathConfidenceBand: string;
  weakestHopOrdinal: number | null;
  weakestHopReason: string;
  hops: ReadonlyArray<SecurityEvidencePathHop>;
  weakestHop: SecurityEvidencePathWeakestHop | null;
  explanationTemplate: SecurityEvidencePathExplanationTemplate | null;
  relatedCutPoints: ReadonlyArray<SecurityEvidencePathCutPoint>;
  routing: ReadonlyArray<SecurityEvidencePathRoutingRow>;
};

export type OperationalSecurityFindingDetail = {
  findingId: string;
  pathId: string | null;
  title: string | null;
};

export type SecurityEvidencePathRankSummary = {
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
  relatedCutPoints: ReadonlyArray<SecurityEvidencePathCutPoint>;
};

export type SecurityEvidencePathRankedPage = {
  items: ReadonlyArray<SecurityEvidencePathRankSummary>;
  totalCount: number;
  page: number;
  pageSize: number;
  topCutPoints: ReadonlyArray<SecurityEvidencePathCutPoint>;
};

export type SecurityEvidencePathReportUnevaluatedGroup = {
  reasonCode: string;
  whyText: string;
  pathCount: number | null;
  pathIds: ReadonlyArray<string>;
  engineName: string | null;
  limitValue: number | null;
  pathsEmitted: number | null;
};

export type SecurityEvidencePathAttackPathReport = {
  snapshotId: string;
  vulnerableAttackPaths: ReadonlyArray<SecurityEvidencePathRankSummary>;
  unevaluatedGroups: ReadonlyArray<SecurityEvidencePathReportUnevaluatedGroup>;
};

export type SecurityEvidencePathRankDetail = {
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
  breakdownJson: string;
  pathKind: string;
  pathConfidenceBand: string;
  dimensionProse: {
    technicalExposure: string;
    privilegeDepth: string;
    blastRadius: string;
    businessConsequence: string;
    confidenceBand: string;
    overall: string;
  };
  computedUtc: string;
};

export type SecurityEvidencePathProposedRemediation = {
  recommendedChange: string;
  recommendedChangeSource: string;
  verificationQueries: ReadonlyArray<string>;
  preconditions: ReadonlyArray<string>;
  suggestedPatternKey: string | null;
};

export type SecurityEvidencePathExplanation = {
  explanationId: string;
  pathId: string;
  executiveSummary: string;
  businessImpactHypotheses: ReadonlyArray<string>;
  proposedRemediation: SecurityEvidencePathProposedRemediation;
  citedEvidenceRefs: ReadonlyArray<string>;
  provenanceKind: string;
  simulatorLabel: string | null;
  createdUtc: string;
};

export type SecurityEvidencePathExplanationResult = {
  succeeded: boolean;
  errorMessage: string | null;
  explanation: SecurityEvidencePathExplanation | null;
};
