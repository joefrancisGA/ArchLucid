"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type RefObject } from "react";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useViewportNarrow } from "@/hooks/useViewportNarrow";
import { partitionRunsIntoWorkQueueSections, type RunWorkQueueSection } from "@/lib/runs/run-work-queue-groups";
import { isBuyerPolishedOperatorShellEnv, isBuyerVocabularyPassActive } from "@/lib/demo-ui-env";
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
  const router = useRouter();
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

  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const buyerPipelineLabels = isBuyerVocabularyPassActive();
  const buyerCollapseFilters = buyerPolished && totalCount <= 1;

  const [filterText, setFilterTextState] = useState(urlFilterText);
  const buyerPackageScope = urlBuyerPackageScope;
  const [sortOrder, setSortOrderState] = useState<SortOrder>(urlSortOrder);
  const [selectedRun, setSelectedRunState] = useState<RunSummary | null>(null);
  const [compareSelection, setCompareSelectionState] = useState<string[]>(() => [...urlCompareRunIds]);
  const [compareSelectionNotice, setCompareSelectionNotice] = useState<string | null>(null);
  const [paginationAnnouncement, setPaginationAnnouncement] = useState("");
  const mobileInspectorShellRef = useRef<HTMLDivElement>(null);
  const viewportNarrow = useViewportNarrow();
  const mobileInspectorTrapActive = viewportNarrow && selectedRun !== null;

  useFocusTrap(mobileInspectorShellRef, mobileInspectorTrapActive);

  useEffect(() => {
    setFilterTextState(urlFilterText);
  }, [urlFilterText]);

  useEffect(() => {
    setSortOrderState(urlSortOrder);
  }, [urlSortOrder]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = runsListSearchHrefFromSearch(searchParams.toString(), filterText, pathname);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [filterText, pathname, router, searchParams]);

  const setFilterText = useCallback((value: string): void => {
    setFilterTextState(value);
  }, []);

  const clearFilterText = useCallback(() => {
    setFilterTextState("");
    router.replace(runsListClearSearchHrefFromSearch(searchParams.toString(), pathname), { scroll: false });
  }, [pathname, router, searchParams]);

  const setSortOrder = useCallback((order: SortOrder): void => {
    setSortOrderState(order);
  }, []);

  const syncCompareInspectorToUrl = useCallback(
    (inspectorRunId: string | null, compareRunIds: readonly string[]) => {
      router.replace(
        runsListCompareInspectorHrefFromSearch(
          searchParams.toString(),
          { inspectorRunId, compareRunIds },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
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
    setCompareSelectionState(parseRunsListCompareRunIdsFromSearch(urlCompareRunsRaw));
  }, [urlCompareRunsRaw]);

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

        return idMatch || desc.includes(query);
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

  const workQueueSections = useMemo(
    () => partitionRunsIntoWorkQueueSections(filteredSorted),
    [filteredSorted],
  );

  const pages = totalPages(totalCount, pageSize);
  useEffect(() => {
    const totalLabel = `${totalCount} review${totalCount === 1 ? "" : "s"} total`;

    setPaginationAnnouncement(`Page ${page} of ${pages}. ${totalLabel}.`);
  }, [page, pages, totalCount]);

  const baseQuery = `projectId=${encodeURIComponent(projectId)}&pageSize=${pageSize}`;
  const previousHref = `/architecture/reviews?${baseQuery}&page=1`;
  const nextHref =
    nextCursor !== null && nextCursor !== undefined && nextCursor.length > 0
      ? `/architecture/reviews?${baseQuery}&page=${page + 1}&cursor=${encodeURIComponent(nextCursor)}`
      : `/architecture/reviews?${baseQuery}&page=${page + 1}`;

  const onRowActivate = useCallback((run: RunSummary, e: MouseEvent<HTMLTableRowElement>) => {
    if ((e.target as HTMLElement).closest("a")) {
      return;
    }

    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
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
    onRowActivate,
    showBuyerPackageCards,
    showCompareSelection,
    toggleCompareSelection,
    clearCompareSelection,
    filterStatusLine,
  };
}
