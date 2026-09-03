"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { sortPlansForPlanningDisplay, sortThemesForPlanningDisplay } from "@/lib/planning-display-order";
import {
  parsePlanningThemeIdFromSearch,
  planningThemeHrefFromSearch,
} from "@/lib/planning/planning-theme-filter-url";

import type { PlanningPageServerLoadResult } from "./load-planning-page-data";
import type { PlanningPageViewModel } from "./planning-page-view-model";
import { PlanningPageView } from "./PlanningPageView";

type PlanningPageClientProps = {
  readonly loaded: PlanningPageServerLoadResult;
};

export function PlanningPageClient(props: PlanningPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlThemeId = parsePlanningThemeIdFromSearch(searchParams.get("theme"));
  const loaded = props.loaded;
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(urlThemeId);
  const [isRefreshing, startRefreshTransition] = useTransition();

  useEffect(() => {
    setSelectedThemeId(urlThemeId);
  }, [urlThemeId]);

  const setSelectedThemeIdWithUrl = useCallback(
    (value: string | null | ((prev: string | null) => string | null)): void => {
      setSelectedThemeId((prev) => {
        const next = typeof value === "function" ? value(prev) : value;

        router.replace(planningThemeHrefFromSearch(searchParams.toString(), next), { scroll: false });

        return next;
      });
    },
    [router, searchParams],
  );

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
    const load = async (): Promise<void> => {
      startRefreshTransition(() => {
        router.refresh();
      });
    };

    if (loaded.kind === "demo") {
      return {
        isDemo: true,
        summary: null,
        sortedThemes: [],
        sortedPlans: [],
        themeTitleById: new Map(),
        visiblePlans: [],
        selectedThemeId: null,
        setSelectedThemeId: setSelectedThemeIdWithUrl,
        selectedThemeTitle: null,
        generatedUtc: null,
        loading: false,
        refreshing: false,
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
      setSelectedThemeId: setSelectedThemeIdWithUrl,
      selectedThemeTitle,
      generatedUtc,
      loading: false,
      refreshing: isRefreshing,
      failure,
      usedPlanningDemoFallback,
      load,
      empty,
    };
  }, [isRefreshing, loaded, router, selectedThemeId, setSelectedThemeIdWithUrl]);

  return <PlanningPageView model={model} />;
}
