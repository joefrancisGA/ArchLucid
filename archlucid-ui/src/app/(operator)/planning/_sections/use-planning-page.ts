"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchLearningPlanningListBundle } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { sortPlansForPlanningDisplay, sortThemesForPlanningDisplay } from "@/lib/planning-display-order";
import { getPlanningStaticDemoBundle, isPlanningDemoStaticFallbackEnabled } from "@/lib/planning-static-demo";
import type { LearningPlanListItemResponse, LearningThemeResponse } from "@/types/learning";

import type { PlanningListSummary, PlanningPageViewModel } from "./planning-page-view-model";

export function usePlanningPage(): PlanningPageViewModel {
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  const [summary, setSummary] = useState<PlanningListSummary | null>(null);
  const [themes, setThemes] = useState<LearningThemeResponse[]>([]);
  const [plans, setPlans] = useState<LearningPlanListItemResponse[]>([]);
  const [generatedUtc, setGeneratedUtc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [usedPlanningDemoFallback, setUsedPlanningDemoFallback] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      setUsedPlanningDemoFallback(false);
      const bundle = await fetchLearningPlanningListBundle({ maxThemes: 50, maxPlans: 50 });
      setSummary(bundle.summary);
      setThemes(bundle.themes.themes);
      setPlans(bundle.plans.plans);
      setGeneratedUtc(bundle.summary.generatedUtc);
      setSelectedThemeId((prev) => {
        if (prev === null) {
          return null;
        }

        const stillThere = bundle.themes.themes.some((t) => t.themeId === prev);

        return stillThere ? prev : null;
      });
    } catch (e) {
      const fb = isPlanningDemoStaticFallbackEnabled() ? getPlanningStaticDemoBundle() : null;

      if (fb !== null) {
        setFailure(null);
        setSummary(fb.summary);
        setThemes(fb.themes);
        setPlans(fb.plans);
        setGeneratedUtc(fb.generatedUtc);
        setUsedPlanningDemoFallback(true);
      } else {
        setFailure(toApiLoadFailure(e));
        setSummary(null);
        setThemes([]);
        setPlans([]);
        setGeneratedUtc(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDemo) {
      return;
    }

    void load();
  }, [isDemo, load]);

  const sortedThemes = useMemo(() => sortThemesForPlanningDisplay(themes), [themes]);
  const sortedPlans = useMemo(() => sortPlansForPlanningDisplay(plans), [plans]);

  const themeTitleById = useMemo(() => {
    const m = new Map<string, string>();

    for (const t of themes) {
      m.set(t.themeId, t.title);
    }

    return m;
  }, [themes]);

  const visiblePlans = useMemo(() => {
    if (selectedThemeId === null) {
      return sortedPlans;
    }

    return sortedPlans.filter((p) => p.themeId === selectedThemeId);
  }, [sortedPlans, selectedThemeId]);

  const selectedThemeTitle =
    selectedThemeId !== null ? themeTitleById.get(selectedThemeId) ?? selectedThemeId : null;

  const empty = summary !== null && summary.themeCount === 0 && summary.planCount === 0;

  return {
    isDemo,
    summary,
    sortedThemes,
    sortedPlans,
    themeTitleById,
    visiblePlans,
    selectedThemeId,
    setSelectedThemeId,
    selectedThemeTitle,
    generatedUtc,
    loading,
    failure,
    usedPlanningDemoFallback,
    load,
    empty,
  };
}
