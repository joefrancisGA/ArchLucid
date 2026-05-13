import { fetchLearningPlanningListBundle } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { getPlanningStaticDemoBundle, isPlanningDemoStaticFallbackEnabled } from "@/lib/planning-static-demo";
import type { LearningPlanListItemResponse, LearningSummaryResponse, LearningThemeResponse } from "@/types/learning";

export type PlanningPageServerLoadResult =
  | { kind: "demo" }
  | {
      kind: "data";
      summary: LearningSummaryResponse | null;
      themes: LearningThemeResponse[];
      plans: LearningPlanListItemResponse[];
      generatedUtc: string | null;
      usedPlanningDemoFallback: boolean;
      failure: ApiLoadFailureState | null;
    };

export async function loadPlanningPageData(): Promise<PlanningPageServerLoadResult> {
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  if (isDemo) {
    return { kind: "demo" };
  }

  try {
    const bundle = await fetchLearningPlanningListBundle({ maxThemes: 50, maxPlans: 50 });

    return {
      kind: "data",
      summary: bundle.summary,
      themes: bundle.themes.themes,
      plans: bundle.plans.plans,
      generatedUtc: bundle.summary.generatedUtc,
      usedPlanningDemoFallback: false,
      failure: null,
    };
  } catch (e: unknown) {
    const fb = isPlanningDemoStaticFallbackEnabled() ? getPlanningStaticDemoBundle() : null;

    if (fb !== null) {
      return {
        kind: "data",
        summary: fb.summary,
        themes: fb.themes,
        plans: fb.plans,
        generatedUtc: fb.generatedUtc,
        usedPlanningDemoFallback: true,
        failure: null,
      };
    }

    return {
      kind: "data",
      summary: null,
      themes: [],
      plans: [],
      generatedUtc: null,
      usedPlanningDemoFallback: false,
      failure: toApiLoadFailure(e),
    };
  }
}
