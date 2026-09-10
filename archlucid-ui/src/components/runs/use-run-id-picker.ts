"use client";

import { useEffect, useId, useMemo, useRef, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";
import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { compareRunBuyerDisplayLabel } from "@/lib/compare-run-display-label";
import {
  parseRunIdPickerOpenFieldFromSearch,
  parseRunIdPickerQueryFromSearch,
  runIdPickerOverlayHrefFromSearch,
} from "@/lib/runs/run-id-picker-overlay-url";

/** Preferred demo run id when multiple rows exist and demo mode is enabled (`NEXT_PUBLIC_DEMO_MODE`). */
const DEMO_RUN_PREF_ID = SHOWCASE_STATIC_DEMO_RUN_ID;
export const RUN_PICKER_MAX_VISIBLE = 50;

export type UseRunIdPickerOptions = {
  readonly value: string;
  readonly onChange: (runId: string) => void;
  /** Called when the user explicitly selects a run from the dropdown (not on every keystroke). */
  readonly onSelect?: (runId: string) => void;
  readonly projectId?: string;
  readonly inputId?: string;
  /** When true, empty/failed run lists use the two-row Compare demo pair when demo spine fallback is enabled. */
  readonly forCompare?: boolean;
  /** When true, only committed runs are listed (capped at 20). */
  readonly committedOnly?: boolean;
  /**
   * When true (default), loads runs on mount and auto-selects the demo / first run when `value` is empty —
   * use `false` for paired Compare pickers when the parent prefills both sides.
   */
  readonly preferAutoPick?: boolean;
  /** When true, primary line is a buyer-facing title; technical run id is shown underneath. */
  readonly useBuyerFacingRunLabels?: boolean;
  /** Invoked when the user picks a row from the list (not on every keystroke). */
  readonly onRunPicked?: (summary: RunSummary) => void;
  /** When set, limits picker rows to reviews of this architecture (AO-29). */
  readonly architectureId?: string;
};

export function runMatchesQuery(run: RunSummary, query: string, useBuyerFacingRunLabels: boolean): boolean {
  const q = query.trim().toLowerCase();

  if (q.length === 0) {
    return true;
  }

  if (run.runId.toLowerCase().includes(q)) {
    return true;
  }

  if (useBuyerFacingRunLabels) {
    return buyerFacingReviewTitleFromSummary(run).toLowerCase().includes(q);
  }

  return (
    (run.displayName ?? "").toLowerCase().includes(q) ||
    (run.description ?? "").toLowerCase().includes(q) ||
    (run.projectId ?? "").toLowerCase().includes(q)
  );
}

export function useRunIdPicker({
  value,
  onChange,
  onSelect,
  projectId = "default",
  inputId,
  forCompare = false,
  committedOnly = false,
  preferAutoPick = true,
  useBuyerFacingRunLabels = false,
  onRunPicked,
  architectureId,
}: UseRunIdPickerOptions) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const urlSyncFieldId = (inputId ?? "").trim();
  const runPickerFieldParam = searchParams.get("runPickerField");
  const runPickerQueryParam = searchParams.get("runPickerQ");
  const pickerOpenFromUrl =
    urlSyncFieldId.length > 0 && parseRunIdPickerOpenFieldFromSearch(runPickerFieldParam) === urlSyncFieldId;
  const generatedId = useId();
  const controlId = inputId ?? `run-id-picker-${generatedId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimerRef = useRef<number | null>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpenState] = useState(pickerOpenFromUrl);
  const [loadRequested, setLoadRequested] = useState(preferAutoPick);
  const [activeIndex, setActiveIndex] = useState(-1);
  const autoPickAppliedRef = useRef(false);
  const previousValueRef = useRef(value);
  const [listFilter, setListFilterState] = useState(() => {
    if (pickerOpenFromUrl) {
      const urlQuery = parseRunIdPickerQueryFromSearch(runPickerQueryParam);

      if (urlQuery.length > 0) {
        return urlQuery;
      }
    }

    return "";
  });

  const syncPickerOverlayToUrl = useCallback(
    (state: { open: boolean; query: string }) => {
      if (urlSyncFieldId.length === 0) {
        return;
      }

      router.replace(
        runIdPickerOverlayHrefFromSearch(
          searchParams.toString(),
          { open: state.open, fieldId: urlSyncFieldId, query: state.query },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams, urlSyncFieldId],
  );

  const setOpen = useCallback(
    (next: boolean | ((current: boolean) => boolean)) => {
      setOpenState((current) => {
        const resolved = typeof next === "function" ? next(current) : next;
        syncPickerOverlayToUrl({ open: resolved, query: listFilter });

        return resolved;
      });
    },
    [listFilter, syncPickerOverlayToUrl],
  );

  const setListFilter = useCallback(
    (next: string) => {
      setListFilterState(next);

      if (open && urlSyncFieldId.length > 0) {
        syncPickerOverlayToUrl({ open: true, query: next });
      }
    },
    [open, syncPickerOverlayToUrl, urlSyncFieldId],
  );

  useEffect(() => {
    if (urlSyncFieldId.length === 0) {
      return;
    }

    const urlField = parseRunIdPickerOpenFieldFromSearch(runPickerFieldParam);
    const urlOpen = urlField === urlSyncFieldId;

    setOpenState(urlOpen);

    if (urlOpen) {
      const urlQuery = parseRunIdPickerQueryFromSearch(runPickerQueryParam);

      if (urlQuery.length > 0) {
        setListFilterState(urlQuery);
      }
    }
  }, [runPickerFieldParam, runPickerQueryParam, urlSyncFieldId]);

  const runsQuery = useAskProjectRunsQuery(projectId, {
    forCompare,
    committedOnly,
    enabled: loadRequested,
  });
  const normalizedArchitectureId = architectureId?.trim() ?? "";
  const architectureQuery = useArchitectureIdentityQuery(
    normalizedArchitectureId,
    normalizedArchitectureId.length > 0,
  );
  const scopedRunIds = useMemo(() => {
    if (normalizedArchitectureId.length === 0 || architectureQuery.data === undefined) {
      return null;
    }

    return new Set(architectureQuery.data.reviews.map((review) => review.runId));
  }, [architectureQuery.data, normalizedArchitectureId.length]);

  const loading = loadRequested && (runsQuery.isPending || (normalizedArchitectureId.length > 0 && architectureQuery.isLoading));
  const runs = useMemo(() => {
    const items = runsQuery.data?.items ?? [];

    if (scopedRunIds === null) {
      return items;
    }

    return items.filter((run) => scopedRunIds.has(run.runId));
  }, [runsQuery.data?.items, scopedRunIds]);
  const loadError =
    runsQuery.isError || runsQuery.data?.loadError === true ? "Could not load reviews list." : null;

  const requestRunsLoad = (): void => {
    setLoadRequested(true);

    if (runsQuery.isFetched) {
      void runsQuery.refetch();
    }
  };

  useEffect(() => {
    if (previousValueRef.current === value) {
      return;
    }

    previousValueRef.current = value;

    if (!useBuyerFacingRunLabels) {
      setQuery(value);
      setListFilter(value);
      return;
    }

    const knownFriendly = compareRunBuyerDisplayLabel(value.trim());

    if (knownFriendly !== null) {
      setQuery(knownFriendly);
      setListFilter(knownFriendly);
      return;
    }

    const match = runs.find((r) => r.runId === value.trim());

    if (match !== undefined) {
      const friendly = buyerFacingReviewTitleFromSummary(match);
      setQuery(friendly);
      setListFilter(friendly);
      return;
    }

    setQuery(value);
    setListFilter(value);
  }, [value, runs, useBuyerFacingRunLabels]);

  useEffect(() => {
    if (!preferAutoPick) {
      return;
    }

    if (loading) {
      return;
    }

    if (value.trim().length > 0) {
      return;
    }

    const demoMode = isNextPublicDemoMode();

    if (loadError !== null) {
      if (!demoMode) {
        return;
      }

      if (autoPickAppliedRef.current) {
        return;
      }

      autoPickAppliedRef.current = true;
      setQuery(SHOWCASE_STATIC_DEMO_RUN_ID);
      onChange(SHOWCASE_STATIC_DEMO_RUN_ID);
      onSelect?.(SHOWCASE_STATIC_DEMO_RUN_ID);

      return;
    }

    if (runs.length === 0) {
      if (!demoMode) {
        return;
      }

      if (autoPickAppliedRef.current) {
        return;
      }

      autoPickAppliedRef.current = true;
      setQuery(SHOWCASE_STATIC_DEMO_RUN_ID);
      onChange(SHOWCASE_STATIC_DEMO_RUN_ID);
      onSelect?.(SHOWCASE_STATIC_DEMO_RUN_ID);

      return;
    }

    const demoPreferred = runs.find((r) => r.runId === DEMO_RUN_PREF_ID);
    const firstItem = runs[0];

    if (runs.length === 1 && firstItem !== undefined) {
      if (autoPickAppliedRef.current) {
        return;
      }

      autoPickAppliedRef.current = true;
      setQuery(firstItem.runId);
      onChange(firstItem.runId);
      onSelect?.(firstItem.runId);

      return;
    }

    if (demoMode && demoPreferred !== undefined) {
      if (autoPickAppliedRef.current) {
        return;
      }

      autoPickAppliedRef.current = true;
      setQuery(demoPreferred.runId);
      onChange(demoPreferred.runId);
      onSelect?.(demoPreferred.runId);
    }
  }, [preferAutoPick, loading, loadError, runs, value, onChange, onSelect]);

  const filtered = useMemo(() => {
    const q = listFilter.trim();

    if (q.length === 0) {
      return runs.slice(0, RUN_PICKER_MAX_VISIBLE);
    }

    return runs
      .filter((r) => runMatchesQuery(r, q, useBuyerFacingRunLabels))
      .slice(0, RUN_PICKER_MAX_VISIBLE);
  }, [runs, listFilter, useBuyerFacingRunLabels]);

  const hiddenMatchCount = useMemo(() => {
    const q = listFilter.trim();

    if (q.length === 0) {
      return Math.max(0, runs.length - RUN_PICKER_MAX_VISIBLE);
    }

    const totalMatches = runs.filter((r) => runMatchesQuery(r, q, useBuyerFacingRunLabels)).length;

    return Math.max(0, totalMatches - RUN_PICKER_MAX_VISIBLE);
  }, [runs, listFilter, useBuyerFacingRunLabels]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(-1);
      return;
    }

    if (filtered.length === 0) {
      setActiveIndex(-1);
      return;
    }

    const selectedIndex = filtered.findIndex((r) => r.runId === value.trim());

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, filtered, value]);

  const selectRun = (run: RunSummary) => {
    const displayValue = useBuyerFacingRunLabels ? buyerFacingReviewTitleFromSummary(run) : run.runId;
    setQuery(displayValue);
    setListFilter(displayValue);
    onChange(run.runId);
    onSelect?.(run.runId);
    onRunPicked?.(run);
    setOpen(false);
  };

  const scheduleClose = () => {
    if (blurTimerRef.current !== null) {
      window.clearTimeout(blurTimerRef.current);
    }

    blurTimerRef.current = window.setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
      }
    }, 150);
  };

  const showRunPopup = open && (filtered.length > 0 || loadError !== null || loading || listFilter.trim().length > 0);
  const popupUsesListbox = !loading && filtered.length > 0;
  const showNoMatches = !loading && loadError === null && listFilter.trim().length > 0 && filtered.length === 0;

  const handleFocus = () => {
    setOpen(true);
    setListFilter("");
    requestRunsLoad();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);

      if (filtered.length === 0) {
        return;
      }

      setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);

      if (filtered.length === 0) {
        return;
      }

      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();

      if (filtered.length > 0) {
        setActiveIndex(0);
      }

      return;
    }

    if (event.key === "End") {
      event.preventDefault();

      if (filtered.length > 0) {
        setActiveIndex(filtered.length - 1);
      }

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      setOpen(true);

      if (activeIndex >= 0 && filtered[activeIndex] !== undefined) {
        selectRun(filtered[activeIndex]);
        return;
      }

      if (filtered.length === 1) {
        selectRun(filtered[0]);
        return;
      }

      const exactIdMatch = runs.find((r) => r.runId.trim().toLowerCase() === query.trim().toLowerCase());

      if (exactIdMatch !== undefined) {
        selectRun(exactIdMatch);
      }
    }
  };

  const handleChange = (next: string) => {
    setQuery(next);
    setListFilter(next);
    setOpen(true);

    // Keep committed value as a review id — typing filters locally until list/Enter selection.
    if (!useBuyerFacingRunLabels) {
      onChange(next);
    }
  };

  return {
    controlId,
    containerRef,
    query,
    open,
    loading,
    runs,
    loadError,
    filtered,
    hiddenMatchCount,
    activeIndex,
    showRunPopup,
    popupUsesListbox,
    showNoMatches,
    useBuyerFacingRunLabels,
    value,
    selectRun,
    scheduleClose,
    handleFocus,
    handleKeyDown,
    handleChange,
    runsQuery,
  };
}
