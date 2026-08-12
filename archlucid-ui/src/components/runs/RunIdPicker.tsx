"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { compareRunBuyerDisplayLabel } from "@/lib/compare-run-display-label";
import { runSummaryDisplayLabel } from "@/lib/runs/run-summary-display-label";

/** Preferred demo run id when multiple rows exist and demo mode is enabled (`NEXT_PUBLIC_DEMO_MODE`). */
const DEMO_RUN_PREF_ID = SHOWCASE_STATIC_DEMO_RUN_ID;
const RUN_PICKER_MAX_VISIBLE = 50;

type RunIdPickerProps = {
  value: string;
  onChange: (runId: string) => void;
  /** Called when the user explicitly selects a run from the dropdown (not on every keystroke). */
  onSelect?: (runId: string) => void;
  placeholder: string;
  label: string;
  projectId?: string;
  inputId?: string;
  /** When true, empty/failed run lists use the two-row Compare demo pair when demo spine fallback is enabled. */
  forCompare?: boolean;
  /** When true, only committed runs are listed (capped at 20). */
  committedOnly?: boolean;
  /**
   * When true (default), loads runs on mount and auto-selects the demo / first run when `value` is empty —
   * use `false` for paired Compare pickers when the parent prefills both sides.
   */
  preferAutoPick?: boolean;
  /** When true, primary line is a buyer-facing title; technical run id is shown underneath. */
  useBuyerFacingRunLabels?: boolean;
  /** Invoked when the user picks a row from the list (not on every keystroke). */
  onRunPicked?: (summary: RunSummary) => void;
  /** When true, focus the combo input on mount (operator list vs compare-entry ergonomics). */
  autoFocus?: boolean;
};

function truncate(text: string, max: number): string {
  const t = text.trim();

  if (t.length <= max)
  {
    return t;
  }

  return `${t.slice(0, max - 1)}…`;
}

function runMatchesQuery(run: RunSummary, query: string, useBuyerFacingRunLabels: boolean): boolean {
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

/**
 * Run ID text field with debounced typeahead over recent runs (server list + local filter).
 */
export function RunIdPicker({
  value,
  onChange,
  onSelect,
  placeholder,
  label,
  projectId = "default",
  inputId,
  forCompare = false,
  committedOnly = false,
  preferAutoPick = true,
  useBuyerFacingRunLabels = false,
  onRunPicked,
  autoFocus = false,
}: RunIdPickerProps) {
  const generatedId = useId();
  const controlId = inputId ?? `run-id-picker-${generatedId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimerRef = useRef<number | null>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [loadRequested, setLoadRequested] = useState(preferAutoPick);
  const [activeIndex, setActiveIndex] = useState(-1);
  const autoPickAppliedRef = useRef(false);
  const previousValueRef = useRef(value);
  const [listFilter, setListFilter] = useState("");

  const runsQuery = useAskProjectRunsQuery(projectId, {
    forCompare,
    committedOnly,
    enabled: loadRequested,
  });

  const loading = loadRequested && runsQuery.isPending;
  const runs = runsQuery.data?.items ?? [];
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

  const popupContainerClass =
    (cn("absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-md dark:border-neutral-700 dark:bg-neutral-900", OPERATOR_TYPOGRAPHY.body));
  const showRunPopup = open && (filtered.length > 0 || loadError !== null || loading || listFilter.trim().length > 0);
  const popupUsesListbox = !loading && filtered.length > 0;
  const showNoMatches = !loading && loadError === null && listFilter.trim().length > 0 && filtered.length === 0;

  return (
    <div ref={containerRef} className="relative max-w-xl">
      <Label htmlFor={controlId} className={cn("mb-1 block font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        {label}
      </Label>
      <Input
        id={controlId}
        role="combobox"
        value={query}
        placeholder={placeholder}
        title={
          useBuyerFacingRunLabels
            ? "Type to filter reviews by title or id. Pick from the list or paste a review id directly."
            : undefined
        }
        autoComplete="off"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${controlId}-listbox` : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 && filtered[activeIndex] !== undefined
            ? `${controlId}-option-${activeIndex}`
            : undefined
        }
        autoFocus={autoFocus}
        onFocus={() => {
          setOpen(true);
          setListFilter("");
          requestRunsLoad();
        }}
        /**
         * Options use `onMouseDown` + `preventDefault` so the input keeps focus while picking. That means another
         * click on the input does not refire `onFocus`, so the list would stay closed — reopen on click as well.
         */
        onClick={() => {
          setOpen(true);
          setListFilter("");
          requestRunsLoad();
        }}
        onBlur={scheduleClose}
        onKeyDown={(event) => {
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
        }}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          setListFilter(next);
          setOpen(true);

          // Keep committed value as a review id — typing filters locally until list/Enter selection.
          if (!useBuyerFacingRunLabels) {
            onChange(next);
          }
        }}
      />
      {showRunPopup ? (
        popupUsesListbox ? (
          <ul
            id={`${controlId}-listbox`}
            role="listbox"
            className={popupContainerClass}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
          >
            {loadError !== null ? (
              <li className="px-3 py-2 text-red-700 dark:text-red-400" role="presentation">
                {loadError}
              </li>
            ) : null}
            {filtered.map((r, index) => {
              const primaryText = useBuyerFacingRunLabels
                ? buyerFacingReviewTitleFromSummary(r)
                : truncate(runSummaryDisplayLabel(r), 52);
              const secondaryText = useBuyerFacingRunLabels ? (
                <span className="sr-only">Technical review id: {truncate(r.runId, 120)}</span>
              ) : (
                truncate(r.runId, 48)
              );
              const isActive = index === activeIndex;

              return (
                <li key={r.runId} role="presentation">
                  <button
                    id={`${controlId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={r.runId === value.trim()}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800",
                      (r.runId === value.trim() || isActive) && "bg-[var(--al-layer-hover)] dark:bg-neutral-800/80",
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                    onClick={() => {
                      selectRun(r);
                    }}
                  >
                    <span className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>{primaryText}</span>
                    {useBuyerFacingRunLabels ? (
                      secondaryText
                    ) : (
                      <span className={cn("font-mono text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{secondaryText}</span>
                    )}
                  </button>
                </li>
              );
            })}
            {hiddenMatchCount > 0 ? (
              <li className="px-3 py-2 text-neutral-600 dark:text-neutral-400" role="presentation">
                {hiddenMatchCount} more match(es) — refine your search or paste a review id directly.
              </li>
            ) : null}
          </ul>
        ) : (
          <div
            id={`${controlId}-listbox`}
            role="status"
            aria-live="polite"
            className={popupContainerClass}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
          >
            {loading ? (
              <div className="px-3 py-2 text-neutral-500 dark:text-neutral-400">Loading reviews…</div>
            ) : null}
            {!loading && loadError !== null ? (
              <div className="px-3 py-2 text-red-700 dark:text-red-400">{loadError}</div>
            ) : null}
            {showNoMatches ? (
              <div className="px-3 py-2 text-neutral-700 dark:text-neutral-300" data-testid="run-id-picker-no-matches">
                No matching reviews. Paste a review id directly in this field to compare an older or in-progress review.
              </div>
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}
