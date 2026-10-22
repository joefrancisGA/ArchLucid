export type ClosedLoopReasoningSourceText = {
  fileName: string;
  contentType: string;
  content: string;
};

export type ArchitectureIntelligenceFramingQuestion = {
  questionId: string;
  prompt: string;
  isAnswered?: boolean;
  inferredAnswer?: string | null;
  confirmedAnswer?: string | null;
  source?: string;
};

export type ArchitectureIntelligenceSpecialistFinding = {
  findingId?: string;
  title?: string;
  severity?: string;
  conclusion?: string;
  rationale?: string;
};

export type ClosedLoopReasoningResult = {
  model?: { elements?: unknown[]; modelId?: string };
  specialistReviews?: Array<{ findings?: ArchitectureIntelligenceSpecialistFinding[] }>;
  recommendations?: unknown[];
  interview?: {
    framingQuestions?: ArchitectureIntelligenceFramingQuestion[];
    evidenceDrivenQuestions?: ArchitectureIntelligenceFramingQuestion[];
  };
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
};

export type ArchitectureIntelligenceProductSourceContext = {
  runId?: string | null;
  sourceTexts?: ClosedLoopReasoningSourceText[];
  declaredPriorities?: string[];
};
