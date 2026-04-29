import type { LearningPlanListItemResponse, LearningSummaryResponse, LearningThemeResponse } from "@/types/learning";

const GENERATED = "2026-04-01T12:00:00.000Z";
const CLAIMS_THEME_ID = "claims-intake-modernization-theme-demo";

/** Curated planning bundle when learning APIs are unavailable in demo screenshot builds (NEXT_PUBLIC_DEMO_MODE). */
export function getPlanningStaticDemoBundle(): {
  summary: LearningSummaryResponse;
  themes: LearningThemeResponse[];
  plans: LearningPlanListItemResponse[];
  generatedUtc: string;
} {
  const summary: LearningSummaryResponse = {
    generatedUtc: GENERATED,
    themeCount: 1,
    planCount: 1,
    totalThemeEvidenceSignals: 12,
    maxPlanPriorityScore: 92,
    totalLinkedSignalsAcrossPlans: 12,
  };

  const themes: LearningThemeResponse[] = [
    {
      themeId: CLAIMS_THEME_ID,
      themeKey: "claims-intake-modernization",
      sourceAggregateKey: "demo",
      patternKey: null,
      title: "Claims Intake Modernization",
      summary: "Consolidated pilot feedback theme aligned with the Claims Intake showcase run.",
      affectedArtifactTypeOrWorkflowArea: "Intake & adjudication",
      severityBand: "Medium",
      evidenceSignalCount: 12,
      distinctRunCount: 3,
      averageTrustScore: 0.82,
      derivationRuleVersion: "demo-1",
      status: "Active",
      createdUtc: GENERATED,
      createdByUserId: null,
    },
  ];

  const plans: LearningPlanListItemResponse[] = [
    {
      planId: "claims-intake-modernization-plan-demo",
      themeId: CLAIMS_THEME_ID,
      title: "Claims Intake Modernization Plan",
      summary: "Prioritized improvements matching the static Claims Intake demo narrative.",
      priorityScore: 92,
      priorityExplanation: "High signal density from pilot feedback rollups.",
      status: "Planned",
      createdUtc: GENERATED,
      themeEvidenceSignalCount: 12,
    },
  ];

  return { summary, themes, plans, generatedUtc: GENERATED };
}

export function isPlanningDemoStaticFallbackEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "1";
}
