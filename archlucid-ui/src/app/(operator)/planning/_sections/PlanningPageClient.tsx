"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { sortPlansForPlanningDisplay, sortThemesForPlanningDisplay } from "@/lib/planning-display-order";

import type { PlanningPageServerLoadResult } from "./load-planning-page-data";
import type { PlanningPageViewModel } from "./planning-page-view-model";
import { PlanningPageView } from "./PlanningPageView";

type PlanningPageClientProps = {
  readonly loaded: PlanningPageServerLoadResult;
};

export function PlanningPageClient(props: PlanningPageClientProps) {
  const router = useRouter();
  const loaded = props.loaded;
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  useEffect(() => {
    if (loaded.kind !== "data") {
      return;
    }

    setSelectedThemeId((prev) => {
      if (prev === null) {
        return null;
      }

      const stillThere = loaded.themes.some((t) => t.themeId === prev);

      return stillThere ? prev : null;
    });
  }, [loaded]);

  const model: PlanningPageViewModel = useMemo(() => {
    const load = (): Promise<void> => Promise.resolve(router.refresh());

    if (loaded.kind === "demo") {
      return {
        isDemo: true,
        summary: null,
        sortedThemes: [],
        sortedPlans: [],
        themeTitleById: new Map(),
        visiblePlans: [],
        selectedThemeId: null,
        setSelectedThemeId,
        selectedThemeTitle: null,
        generatedUtc: null,
        loading: false,
        failure: null,
        usedPlanningDemoFallback: false,
        load,
        empty: false,
      };
    }

    const summary = loaded.summary;
    const themes = loaded.themes;
    const plans = loaded.plans;
    const generatedUtc = loaded.generatedUtc;
    const usedPlanningDemoFallback = loaded.usedPlanningDemoFallback;
    const failure = loaded.failure;

    const sortedThemes = sortThemesForPlanningDisplay(themes);
    const sortedPlans = sortPlansForPlanningDisplay(plans);

    const themeTitleById = new Map<string, string>();

    for (const t of themes) {
      themeTitleById.set(t.themeId, t.title);
    }

    const visiblePlans =
      selectedThemeId === null ? sortedPlans : sortedPlans.filter((p) => p.themeId === selectedThemeId);

    const selectedThemeTitle =
      selectedThemeId !== null ? themeTitleById.get(selectedThemeId) ?? selectedThemeId : null;

    const empty = summary !== null && summary.themeCount === 0 && summary.planCount === 0;

    return {
      isDemo: false,
      summary,
      sortedThemes,
      sortedPlans,
      themeTitleById,
      visiblePlans,
      selectedThemeId,
      setSelectedThemeId,
      selectedThemeTitle,
      generatedUtc,
      loading: false,
      failure,
      usedPlanningDemoFallback,
      load,
      empty,
    };
  }, [loaded, router, selectedThemeId]);

  return <PlanningPageView model={model} />;
}
