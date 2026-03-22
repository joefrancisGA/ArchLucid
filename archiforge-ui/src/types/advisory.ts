export type ImprovementRecommendation = {
  recommendationId: string;
  title: string;
  category: string;
  rationale: string;
  suggestedAction: string;
  urgency: string;
  expectedImpact: string;
  priorityScore: number;
};

export type ImprovementPlan = {
  runId: string;
  comparedToRunId?: string | null;
  generatedUtc: string;
  summaryNotes: string[];
  recommendations: ImprovementRecommendation[];
};
