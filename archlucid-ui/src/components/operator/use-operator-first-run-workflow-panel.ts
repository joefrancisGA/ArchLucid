"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { useCorePilotTeamChecklistQuery } from "@/hooks/use-core-pilot-team-checklist-query";
import { putCorePilotTeamChecklistStep } from "@/lib/api";
import { emitCorePilotChecklistChanged } from "@/lib/core-pilot-checklist-storage";
import { readHasExistingRunsCache, writeHasExistingRunsCache } from "@/lib/operator/operator-run-presence";

import {
  clearOperatorFirstRunGraduated,
  clearOperatorFirstRunMinimized,
  operatorFirstRunCorePilotSteps,
  operatorFirstRunEmptyCommitContext,
  operatorFirstRunShowcaseCommitContext,
  persistOperatorFirstRunGraduated,
  persistOperatorFirstRunMinimized,
  readOperatorFirstRunDoneByIndexFromStorage,
  readOperatorFirstRunGraduatedFromStorage,
  readOperatorFirstRunMinimizedFromStorage,
  syncOperatorFirstRunDoneByIndexToStorage,
} from "./operator-first-run-workflow-storage";
import {
  operatorFirstRunWorkflowMinimizedDisclosureHrefFromSearch,
  parseOperatorFirstRunWorkflowMinimizedOpenFromSearch,
} from "@/lib/operator/operator-first-run-workflow-minimized-disclosure-url";

export function useOperatorFirstRunWorkflowPanel(props: { exploreCompletedOutput?: boolean } = {}) {
  const exploreCompletedOutput = props.exploreCompletedOutput === true;
  const pathname = usePathname() ?? "/";
  const autoGraduateBlockedRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [graduated, setGraduated] = useState(false);
  const [doneByIndex, setDoneByIndex] = useState<boolean[]>(() => operatorFirstRunCorePilotSteps.map(() => false));
  const [hasAnyRun, setHasAnyRun] = useState(false);
  const minimizedRef = useRef(minimized);
  minimizedRef.current = minimized;

  const readMinimizedOpenParam = (): string | null => {
    if (typeof window === "undefined") {
      return null;
    }

    return new URLSearchParams(window.location.search).get("operatorFirstRunWorkflowMinimizedOpen");
  };

  const resolveMinimizedFromLocation = (): boolean => {
    const param = readMinimizedOpenParam();

    if (param !== null) {
      return parseOperatorFirstRunWorkflowMinimizedOpenFromSearch(param);
    }

    return readOperatorFirstRunMinimizedFromStorage();
  };

  const syncMinimizedToUrl = useCallback(
    (minimizedState: boolean) => {
      commitHrefIfChanged(
        operatorFirstRunWorkflowMinimizedDisclosureHrefFromSearch(
          readWindowLocationSearch(),
          minimizedState,
          pathname,
        ),
        { notify: false },
      );
    },
    [pathname],
  );

  const commitContextQuery = useCorePilotCommitContextQuery({ enabled: !exploreCompletedOutput });
  const runsQuery = useAskProjectRunsQuery("default");
  const checklistQuery = useCorePilotTeamChecklistQuery({ enabled: hydrated && !exploreCompletedOutput });

  const commitCtx = exploreCompletedOutput
    ? operatorFirstRunShowcaseCommitContext
    : (commitContextQuery.data ?? operatorFirstRunEmptyCommitContext);

  useEffect(() => {
    const nextDone = readOperatorFirstRunDoneByIndexFromStorage();
    const allDoneFromStorage = nextDone.length === operatorFirstRunCorePilotSteps.length && nextDone.every(Boolean);
    const nextMinimized = resolveMinimizedFromLocation();

    setDoneByIndex(nextDone);
    minimizedRef.current = nextMinimized;
    setMinimized(nextMinimized);
    setGraduated(readOperatorFirstRunGraduatedFromStorage(allDoneFromStorage));
    setHydrated(true);
  }, []);

  useEffect(() => {
    const syncMinimizedFromUrl = (): void => {
      const param = readMinimizedOpenParam();

      if (param === null) {
        return;
      }

      const next = parseOperatorFirstRunWorkflowMinimizedOpenFromSearch(param);

      if (minimizedRef.current === next) {
        return;
      }

      minimizedRef.current = next;
      setMinimized(next);
    };

    syncMinimizedFromUrl();
    window.addEventListener("popstate", syncMinimizedFromUrl);

    return () => {
      window.removeEventListener("popstate", syncMinimizedFromUrl);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || exploreCompletedOutput || checklistQuery.isPending) {
      return;
    }

    if (checklistQuery.isError) {
      return;
    }

    const rows = checklistQuery.data ?? [];
    const serverDone = operatorFirstRunCorePilotSteps.map(() => false);

    for (const r of rows) {
      if (r.stepIndex >= 0 && r.stepIndex < serverDone.length && r.isCompleted) {
        serverDone[r.stepIndex] = true;
      }
    }

    setDoneByIndex((prev) => {
      const merged = prev.map((p, i) => p || serverDone[i]);

      syncOperatorFirstRunDoneByIndexToStorage(merged);

      for (let i = 0; i < merged.length; i++) {
        if (merged[i] && !serverDone[i]) {
          void putCorePilotTeamChecklistStep(i, true).catch(() => {});
        }
      }

      return merged;
    });
    emitCorePilotChecklistChanged();
  }, [
    checklistQuery.data,
    checklistQuery.isError,
    checklistQuery.isPending,
    exploreCompletedOutput,
    hydrated,
  ]);

  useEffect(() => {
    setHasAnyRun(readHasExistingRunsCache());

    if (!runsQuery.data) {
      return;
    }

    const next = runsQuery.data.items.length > 0;
    setHasAnyRun(next);
    writeHasExistingRunsCache(next);
  }, [runsQuery.data]);

  const doneCount = useMemo(() => doneByIndex.filter(Boolean).length, [doneByIndex]);
  const allDone = doneCount === operatorFirstRunCorePilotSteps.length;

  useEffect(() => {
    if (!hydrated || !allDone) {
      return;
    }

    if (autoGraduateBlockedRef.current) {
      return;
    }

    persistOperatorFirstRunGraduated();
    setGraduated(true);
  }, [hydrated, allDone]);

  function minimize() {
    if (minimizedRef.current) {
      return;
    }

    minimizedRef.current = true;
    setMinimized(true);
    persistOperatorFirstRunMinimized();
    syncMinimizedToUrl(true);
  }

  function expand() {
    if (!minimizedRef.current) {
      return;
    }

    minimizedRef.current = false;
    setMinimized(false);
    clearOperatorFirstRunMinimized();
    syncMinimizedToUrl(false);
  }

  function revisitChecklist() {
    autoGraduateBlockedRef.current = true;
    clearOperatorFirstRunGraduated();
    setGraduated(false);
    minimizedRef.current = false;
    setMinimized(false);
    clearOperatorFirstRunMinimized();
    syncMinimizedToUrl(false);
  }

  return {
    exploreCompletedOutput,
    hydrated,
    minimized,
    graduated,
    doneCount,
    allDone,
    hasAnyRun,
    commitCtx,
    corePilotSteps: operatorFirstRunCorePilotSteps,
    minimize,
    expand,
    revisitChecklist,
  };
}

export type OperatorFirstRunWorkflowPanelViewModel = ReturnType<typeof useOperatorFirstRunWorkflowPanel>;
