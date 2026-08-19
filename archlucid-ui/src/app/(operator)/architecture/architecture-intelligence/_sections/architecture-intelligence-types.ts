export type ClosedLoopReasoningSourceText = {
  fileName: string;
  contentType: string;
  content: string;
};

export type SpecialistReviewFinding = {
  findingId?: string;
  title: string;
  severity: string;
  conclusion: string;
  evidenceCondition?: string;
  governanceDisposition?: string;
  rationale?: string;
};

export type ArchitectureRecommendation = {
  recommendationId: string;
  problem: string;
  proposedChange: string;
};

export type MustNotFailViolation = {
  class: string;
  message: string;
  blocked: boolean;
};

export type FramingQuestion = {
  questionId: string;
  prompt: string;
  isAnswered: boolean;
  confirmedAnswer?: string | null;
  source?: string;
};

export type EvidenceValidationResult = {
  findingId: string;
  overallPassedIntegrity: boolean;
  escalated: boolean;
  semanticAssessment?: string | null;
  stageResults?: Array<{
    stage: string;
    passed: boolean;
    isDeterministic: boolean;
    detail?: string;
  }>;
};

export type AdversarialReviewResult = {
  substantiatedFindings?: SpecialistReviewFinding[];
  challenges?: Array<{ hypothesis: string; falsificationEvidenceNeeded: string; suppressed?: boolean }>;
  falsePositiveRateByLane?: Record<string, number>;
};

export type ClosedLoopReasoningResult = {
  model: { elements: unknown[]; modelId?: string };
  specialistReviews: Array<{ findings: SpecialistReviewFinding[] }>;
  recommendations: ArchitectureRecommendation[];
  mustNotFailViolations: MustNotFailViolation[];
  interview?: {
    framingQuestions?: FramingQuestion[];
    evidenceDrivenQuestions?: FramingQuestion[];
  };
  adversarial?: AdversarialReviewResult;
  validationResults?: EvidenceValidationResult[];
  publishBlocked?: boolean;
  publishBlockReasons?: string[];
  integrityPassedFindingIds?: string[];
  runId?: string | null;
  modelId?: string | null;
  publishedToProduct?: boolean;
  publishedFindingsSnapshotId?: string | null;
  publishedRecommendationCount?: number;
  publishSkipReason?: string | null;
  cacheHit?: boolean;
  cacheReuseReason?: string | null;
  budgetRejected?: boolean;
  budgetRejectReason?: string | null;
  budgetEstimatedTokens?: number;
  budgetMaxTokens?: number;
  budgetEstimatedCostUsd?: number | null;
  budgetRemainingUsd?: number | null;
  budgetEnforced?: boolean;
  productFindings?: Array<{
    findingId: string;
    title: string;
    severity: string;
    properties?: Record<string, string>;
  }>;
};

export type CategoryBenchmarkScore = {
  category: string;
  score: number;
  detail: string;
};

export type GoldenArchitectureTestResult = {
  beforeCounts: Record<string, number>;
  afterCounts: Record<string, number>;
  deltaCounts?: Record<string, number>;
  plantedDefectRecall: number;
  plantedDefectsDetected?: string[];
  plantedDefectsMissed?: string[];
  falsePositiveCount: number;
  falsePositivesByDimension?: Record<string, number>;
  categoryScores?: CategoryBenchmarkScore[];
  mutationChangedFindings?: boolean;
  reReviewTriggered?: boolean;
  passed: boolean;
  notes?: string | null;
};

export type ReasoningRunState = {
  kind: "reasoning";
  result: ClosedLoopReasoningResult;
};

export type GoldenRunState = {
  kind: "golden";
  result: GoldenArchitectureTestResult;
};

export type RunState = ReasoningRunState | GoldenRunState;
