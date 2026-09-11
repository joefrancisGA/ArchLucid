export type SecurityEvidencePathHop = {
  hopOrdinal: number;
  fromNodeLabel: string;
  toNodeLabel: string;
  edgeType: string;
  provenanceKind: string;
  hopConfidenceBand: string;
  inferenceSource: string | null;
  evidenceReference: string;
  cloudResourceId: string | null;
};

export type SecurityEvidencePathWeakestHop = {
  hopOrdinal: number;
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
  weakestHopOrdinal: number;
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
  rankOrder: number;
  ruleVersion: string;
  technicalExposureScore: number;
  privilegeDepthScore: number;
  blastRadiusScore: number;
  businessConsequenceScore: number | null;
  confidenceBandScore: number;
  compositeSortScore: number;
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

export type SecurityEvidencePathRankDetail = {
  pathId: string;
  snapshotId: string;
  rankOrder: number;
  ruleVersion: string;
  technicalExposureScore: number;
  privilegeDepthScore: number;
  blastRadiusScore: number;
  businessConsequenceScore: number | null;
  confidenceBandScore: number;
  compositeSortScore: number;
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
