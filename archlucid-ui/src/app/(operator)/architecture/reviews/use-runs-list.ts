"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type RefObject } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useViewportNarrow } from "@/hooks/useViewportNarrow";
import { partitionRunsIntoWorkQueueSections, type RunWorkQueueSection } from "@/lib/runs/run-work-queue-groups";
import { isBuyerVocabularyPassActive } from "@/lib/demo-ui-env";
import { resolveProductionEvalChrome } from "@/lib/production-desk-chrome";
import {
  canonicalizeDemoRunId,
  dedupeRunSummariesByRunId,
  normalizeRunSummaryForDemoPicker,
} from "@/lib/demo-run-canonical";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { runsListPageFilterStatusLine } from "@/lib/runs-list-filter-status-line";
import type { RunSummary } from "@/types/authority";

import type { BuyerPackageScopeFilter, RunsListClientProps, SortOrder } from "./runs-list-types";
import { parseBuyerPackageScopeFilter } from "./buyer-package-scope-url";
import {
  parseRunsListSearchQuery,
  runsListClearSearchHrefFromSearch,
  runsListEffectiveSearchFromSearch,
  runsListSearchHrefFromSearch,
} from "@/lib/runs/runs-list-search-url";
import {
  parseRunsListSortFromSearch,
  sortOrderFromRunsListSort,
} from "@/lib/runs/runs-list-sort-url";
import {
  parseRunsListCompareRunIdsFromSearch,
  parseRunsListInspectorRunIdFromSearch,
  runsListCompareInspectorHrefFromSearch,
} from "@/lib/runs/runs-list-compare-inspector-url";
import {
  runsListNextPageHrefFromSearch,
  runsListPreviousPageHrefFromSearch,
} from "@/lib/runs/runs-list-pagination-url";

import { shouldIgnoreRunsListRowActivation } from "./runs-list-row-activation";

function totalPages(totalCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}

export type UseRunsListResult = {
  projectId: string;
  page: number;
  totalCount: number;
  listContextFilter: string | null;
  buyerPolished: boolean;
  buyerPipelineLabels: boolean;
  buyerCollapseFilters: boolean;
  filterText: string;
  setFilterText: (value: string) => void;
  clearFilterText: () => void;
  buyerPackageScope: BuyerPackageScopeFilter;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  selectedRun: RunSummary | null;
  setSelectedRun: (run: RunSummary | null) => void;
  compareSelection: string[];
  compareSelectionNotice: string | null;
  paginationAnnouncement: string;
  mobileInspectorShellRef: RefObject<HTMLDivElement | null>;
  viewportNarrow: boolean;
  closeInspector: () => void;
  filteredSorted: RunSummary[];
  workQueueSections: RunWorkQueueSection[];
  pages: number;
  previousHref: string;
  nextHref: string;
  navigationSearch: string;
  onRowActivate: (run: RunSummary, e: MouseEvent<HTMLTableRowElement>) => void;
  showBuyerPackageCards: boolean;
  showCompareSelection: boolean;
  toggleCompareSelection: (runId: string) => void;
  clearCompareSelection: () => void;
  filterStatusLine: string;
};

/** Page controller: runs list filter, sort, inspector, and pagination state. */
export function useRunsList(props: RunsListClientProps): UseRunsListResult {
  const { runs, projectId, page, pageSize, totalCount, nextCursor = null } = props;
  const pathname = usePathname() ?? "/architecture/reviews";
  const searchParams = useSearchParams();
  const listContextFilter = searchParams.get("filter");
  const urlBuyerPackageScope = parseBuyerPackageScopeFilter(searchParams.get("scope"));
  const urlFilterText = parseRunsListSearchQuery(searchParams.get("q"));
  const urlSortOrder = sortOrderFromRunsListSort(parseRunsListSortFromSearch(searchParams.get("sort")));
  const urlCompareRunsRaw = searchParams.get("compareRuns");
  const urlInspectorRunId = parseRunsListInspectorRunIdFromSearch(searchParams.get("inspectorRunId"));
  const urlCompareRunIds = parseRunsListCompareRunIdsFromSearch(urlCompareRunsRaw);
  const safeRuns = useMemo(() => {
    const filtered = runs.filter((run) => {
      if (typeof run.runId !== "string" || run.runId.trim().length === 0) {
        return false;
      }

      if (typeof run.createdUtc !== "string" || run.createdUtc.trim().length === 0) {
        return false;
      }

      return true;
    });

    return dedupeRunSummariesByRunId(filtered.map(normalizeRunSummaryForDemoPicker));
  }, [runs]);

  const { mode } = useWorkspaceMode();
  const buyerPolished = resolveProductionEvalChrome({ workspaceMode: mode });
  const buyerPipelineLabels = isBuyerVocabularyPassActive();
  const buyerCollapseFilters = buyerPolished && totalCount <= 1;

  const [filterText, setFilterTextState] = useState(urlFilterText);
  const filterTextRef = useRef(filterText);
  filterTextRef.current = filterText;
  const buyerPackageScope = urlBuyerPackageScope;
  const [sortOrder, setSortOrderState] = useState<SortOrder>(urlSortOrder);
  const sortOrderRef = useRef(sortOrder);
  sortOrderRef.current = sortOrder;
  const [selectedRun, setSelectedRunState] = useState<RunSummary | null>(null);
  const [compareSelection, setCompareSelectionState] = useState<string[]>(() => [...urlCompareRunIds]);
  const compareSelectionRef = useRef(compareSelection);
  compareSelectionRef.current = compareSelection;
  const [compareSelectionNotice, setCompareSelectionNotice] = useState<string | null>(null);
  const [paginationAnnouncement, setPaginationAnnouncement] = useState("");
  const mobileInspectorShellRef = useRef<HTMLDivElement>(null);
  const viewportNarrow = useViewportNarrow();
  const mobileInspectorTrapActive = viewportNarrow && selectedRun !== null;

  useFocusTrap(mobileInspectorShellRef, mobileInspectorTrapActive);

  useEffect(() => {
    const syncFilterTextFromUrl = (): void => {
      const next = parseRunsListSearchQuery(new URLSearchParams(window.location.search).get("q"));

      if (filterTextRef.current === next) {
        return;
      }

      filterTextRef.current = next;
      setFilterTextState(next);
    };

    syncFilterTextFromUrl();
    window.addEventListener("popstate", syncFilterTextFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFilterTextFromUrl);
    };
  }, []);

  useEffect(() => {
    const syncSortOrderFromUrl = (): void => {
      const next = sortOrderFromRunsListSort(
        parseRunsListSortFromSearch(new URLSearchParams(window.location.search).get("sort")),
      );

      if (sortOrderRef.current === next) {
        return;
      }

      sortOrderRef.current = next;
      setSortOrderState(next);
    };

    syncSortOrderFromUrl();
    window.addEventListener("popstate", syncSortOrderFromUrl);

    return () => {
      window.removeEventListener("popstate", syncSortOrderFromUrl);
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      commitHrefIfChanged(
        runsListSearchHrefFromSearch(readWindowLocationSearch(), filterText, pathname),
        { notify: false },
      );
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [filterText, pathname]);

  const setFilterText = useCallback((value: string): void => {
    filterTextRef.current = value;
    setFilterTextState(value);
  }, []);

  const clearFilterText = useCallback(() => {
    filterTextRef.current = "";
    setFilterTextState("");
    commitHrefIfChanged(runsListClearSearchHrefFromSearch(readWindowLocationSearch(), pathname), {
      notify: false,
    });
  }, [pathname]);

  const setSortOrder = useCallback((order: SortOrder): void => {
    sortOrderRef.current = order;
    setSortOrderState(order);
  }, []);

  const syncCompareInspectorToUrl = useCallback(
    (inspectorRunId: string | null, compareRunIds: readonly string[]) => {
      commitHrefIfChanged(
        runsListCompareInspectorHrefFromSearch(
          runsListEffectiveSearchFromSearch(readWindowLocationSearch(), filterTextRef.current),
          { inspectorRunId, compareRunIds },
          pathname,
        ),
        { notify: false },
      );
    },
    [pathname],
  );

  const setSelectedRun = useCallback(
    (run: RunSummary | null) => {
      setSelectedRunState(run);
      syncCompareInspectorToUrl(run?.runId ?? null, compareSelection);
    },
    [compareSelection, syncCompareInspectorToUrl],
  );

  const setCompareSelection = useCallback(
    (value: string[] | ((current: string[]) => string[])) => {
      setCompareSelectionState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncCompareInspectorToUrl(selectedRun?.runId ?? null, next);

        return next;
      });
    },
    [selectedRun?.runId, syncCompareInspectorToUrl],
  );

  useEffect(() => {
    const syncCompareSelectionFromUrl = (): void => {
      const next = [
        ...parseRunsListCompareRunIdsFromSearch(
          new URLSearchParams(window.location.search).get("compareRuns"),
        ),
      ];
      const current = compareSelectionRef.current;

      if (current.length === next.length && current.every((id, index) => id === next[index])) {
        return;
      }

      compareSelectionRef.current = next;
      setCompareSelectionState(next);
    };

    syncCompareSelectionFromUrl();
    window.addEventListener("popstate", syncCompareSelectionFromUrl);

    return () => {
      window.removeEventListener("popstate", syncCompareSelectionFromUrl);
    };
  }, []);

  useEffect(() => {
    if (safeRuns.length === 0) {
      setSelectedRunState(null);

      return;
    }

    if (urlInspectorRunId.length > 0) {
      const fromUrl = safeRuns.find((run) => run.runId === urlInspectorRunId) ?? null;

      if (fromUrl !== null) {
        setSelectedRunState(fromUrl);

        return;
      }
    }

    setSelectedRunState((current) => {
      if (current !== null && safeRuns.some((r) => r.runId === current.runId)) {
        return current;
      }

      // Keep drawer closed on initial load; only auto-close if the selected run was removed.
      return null;
    });
  }, [safeRuns, urlInspectorRunId]);

  const closeInspector = useCallback(() => {
    setSelectedRun(null);
  }, [setSelectedRun]);

  useEffect(() => {
    if (selectedRun === null) {
      return;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeInspector();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedRun, closeInspector]);

  const filteredSorted = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    let list = safeRuns;

    if (query.length > 0) {
      list = list.filter((run) => {
        const idMatch = run.runId.toLowerCase().includes(query);
        const desc = (run.description ?? "").toLowerCase();
        const displayName = (run.displayName ?? "").toLowerCase();

        return idMatch || desc.includes(query) || displayName.includes(query);
      });
    }

    if (buyerPolished) {
      if (buyerPackageScope === "finalized") {
        list = list.filter((run) => run.hasGoldenManifest === true);
      }

      if (buyerPackageScope === "in_flight") {
        list = list.filter((run) => run.hasGoldenManifest !== true);
      }
    }

    return [...list].sort((left, right) => {
      const leftIsShowcase = canonicalizeDemoRunId(left.runId) === SHOWCASE_STATIC_DEMO_RUN_ID;
      const rightIsShowcase = canonicalizeDemoRunId(right.runId) === SHOWCASE_STATIC_DEMO_RUN_ID;

      if (leftIsShowcase) {
        return -1;
      }

      if (rightIsShowcase) {
        return 1;
      }

      const leftTime = new Date(left.createdUtc).getTime();
      const rightTime = new Date(right.createdUtc).getTime();

      return sortOrder === "createdDesc" ? rightTime - leftTime : leftTime - rightTime;
    });
  }, [safeRuns, filterText, sortOrder, buyerPolished, buyerPackageScope]);

  useEffect(() => {
    if (selectedRun === null) {
      return;
    }

    if (!filteredSorted.some((run) => run.runId === selectedRun.runId)) {
      setSelectedRun(null);
    }
  }, [filteredSorted, selectedRun, setSelectedRun]);

  const workQueueSections = useMemo(
    () => partitionRunsIntoWorkQueueSections(filteredSorted),
    [filteredSorted],
  );

  const pages = totalPages(totalCount, pageSize);
  useEffect(() => {
    const totalLabel = `${totalCount} review${totalCount === 1 ? "" : "s"} total`;

    setPaginationAnnouncement(`Page ${page} of ${pages}. ${totalLabel}.`);
  }, [page, pages, totalCount]);

  const currentSearch = searchParams.toString();
  const navigationSearch = runsListEffectiveSearchFromSearch(currentSearch, filterText);
  const previousHref = runsListPreviousPageHrefFromSearch(
    navigationSearch,
    pathname,
    projectId,
    pageSize,
  );
  const nextHref = runsListNextPageHrefFromSearch(
    navigationSearch,
    pathname,
    projectId,
    pageSize,
    page + 1,
    nextCursor,
  );

  const onRowActivate = useCallback((run: RunSummary, e: MouseEvent<HTMLTableRowElement>) => {
    if (shouldIgnoreRunsListRowActivation(e.target)) {
      return;
    }

    setSelectedRun(run);
  }, [setSelectedRun]);

  const listNarrowingActive =
    filterText.trim().length > 0 || (buyerPolished === true && buyerPackageScope !== "all");
  const showBuyerPackageCards =
    buyerPolished === true &&
    pages === 1 &&
    filteredSorted.length > 0 &&
    !listNarrowingActive;

  const showCompareSelection = safeRuns.length >= 2 && !showBuyerPackageCards;

  useEffect(() => {
    if (showCompareSelection || compareSelection.length === 0) {
      return;
    }

    setCompareSelection([]);
    setCompareSelectionNotice(null);
  }, [compareSelection.length, setCompareSelection, showCompareSelection]);

  const toggleCompareSelection = useCallback((runId: string) => {
    setCompareSelection((current) => {
      if (current.includes(runId)) {
        setCompareSelectionNotice(null);

        return current.filter((id) => id !== runId);
      }

      if (current.length >= 2) {
        setCompareSelectionNotice("Only two reviews can be compared — oldest selection was replaced.");

        return [current[1]!, runId];
      }

      setCompareSelectionNotice(null);

      return [...current, runId];
    });
  }, [setCompareSelection]);

  const clearCompareSelection = useCallback(() => {
    setCompareSelection([]);
    setCompareSelectionNotice(null);
  }, [setCompareSelection]);

  const filterStatusLine = runsListPageFilterStatusLine(
    filteredSorted.length,
    safeRuns.length,
    listNarrowingActive
  );

  return {
    projectId,
    page,
    totalCount,
    listContextFilter,
    buyerPolished,
    buyerPipelineLabels,
    buyerCollapseFilters,
    filterText,
    setFilterText,
    clearFilterText,
    buyerPackageScope,
    sortOrder,
    setSortOrder,
    selectedRun,
    setSelectedRun,
    compareSelection,
    compareSelectionNotice,
    paginationAnnouncement,
    mobileInspectorShellRef,
    viewportNarrow,
    closeInspector,
    filteredSorted,
    workQueueSections,
    pages,
    previousHref,
    nextHref,
    navigationSearch,
    onRowActivate,
    showBuyerPackageCards,
    showCompareSelection,
    toggleCompareSelection,
    clearCompareSelection,
    filterStatusLine,
  };
}
