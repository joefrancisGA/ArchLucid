"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator-run-picker-client";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import { compareRunBuyerDisplayLabel } from "@/lib/compare-run-display-label";
import { runSummaryDisplayLabel } from "@/lib/run-summary-display-label";
import { cn } from "@/lib/utils";

/** Preferred demo run id when multiple rows exist and demo mode is enabled (`NEXT_PUBLIC_DEMO_MODE`). */
const DEMO_RUN_PREF_ID = "claims-intake-modernization";

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
  preferAutoPick = true,
  useBuyerFacingRunLabels = false,
  onRunPicked,
  autoFocus = false,
}: RunIdPickerProps) {
  const generatedId = useId();
  const controlId = inputId ?? `run-id-picker-${generatedId}`;
  const [query, setQuery] = useState(value);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const autoPickAppliedRef = useRef(false);

  useEffect(() => {
    if (!useBuyerFacingRunLabels) {
      setQuery(value);
      return;
    }

    const knownFriendly = compareRunBuyerDisplayLabel(value.trim());

    if (knownFriendly !== null) {
      setQuery(knownFriendly);
      return;
    }

    const match = runs.find((r) => r.runId === value.trim());

    if (match !== undefined) {
      setQuery(buyerFacingReviewTitleFromSummary(match));
      return;
    }

    setQuery(value);
  }, [value, runs, useBuyerFacingRunLabels]);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const merged = await loadProjectRunsMergedWithDemoFallback(projectId, { forCompare });
      setRuns(merged.items ?? []);
      setLoadError(merged.loadError ? "Could not load reviews list." : null);
    } catch {
      setRuns([]);
      setLoadError("Could not load reviews list.");
    } finally {
      setLoading(false);
    }
  }, [projectId, forCompare]);

  useEffect(() => {
    if (!preferAutoPick) {
      return;
    }

    void loadRuns();
  }, [preferAutoPick, loadRuns]);

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
    if (useBuyerFacingRunLabels) {
      return runs.slice(0, 12);
    }

    const q = query.trim().toLowerCase();

    if (q.length === 0) {
      return runs.slice(0, 12);
    }

    return runs
      .filter(
        (r) =>
          r.runId.toLowerCase().includes(q) ||
          (r.displayName ?? "").toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q) ||
          (r.projectId ?? "").toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [runs, query, useBuyerFacingRunLabels]);

  const popupContainerClass =
    "absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-neutral-200 bg-white py-1 text-sm shadow-md dark:border-neutral-700 dark:bg-neutral-900";
  /** role="listbox" must contain option/group children — avoid it for loading-only or empty-list error banners (axe aria-required-children). */
  const showRunPopup = open && (filtered.length > 0 || loadError !== null || loading);
  const popupUsesListbox = !loading && filtered.length > 0;

  return (
    <div className="relative max-w-xl">
      <Label htmlFor={controlId} className="mb-1 block text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {label}
      </Label>
      <Input
        id={controlId}
        role="combobox"
        value={query}
        placeholder={placeholder}
        readOnly={useBuyerFacingRunLabels}
        title={
          useBuyerFacingRunLabels
            ? "Pick a review from the list. The field shows the review title; selection keeps the technical id for loading."
            : undefined
        }
        autoComplete="off"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${controlId}-listbox` : undefined}
        autoFocus={autoFocus}
        onFocus={() => {
          setOpen(true);
          void loadRuns();
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
          }, 150);
        }}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          onChange(next);
          setOpen(true);
        }}
      />
      {showRunPopup ? (
        popupUsesListbox ? (
          <ul id={`${controlId}-listbox`} role="listbox" className={popupContainerClass}>
            {loadError !== null ? (
              <li className="px-3 py-2 text-red-700 dark:text-red-400" role="presentation">
                {loadError}
              </li>
            ) : null}
            {filtered.map((r) => {
              const primaryText = useBuyerFacingRunLabels
                ? buyerFacingReviewTitleFromSummary(r)
                : truncate(runSummaryDisplayLabel(r), 52);
              const secondaryText = useBuyerFacingRunLabels ? (
                <span className="sr-only">Technical review id: {truncate(r.runId, 120)}</span>
              ) : (
                truncate(r.runId, 48)
              );

              return (
                <li key={r.runId} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={r.runId === value.trim()}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800",
                      r.runId === value.trim() && "bg-teal-50 dark:bg-teal-900/20",
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                    onClick={() => {
                      setQuery(useBuyerFacingRunLabels ? buyerFacingReviewTitleFromSummary(r) : r.runId);
                      onChange(r.runId);
                      onSelect?.(r.runId);
                      onRunPicked?.(r);
                      setOpen(false);
                    }}
                  >
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{primaryText}</span>
                    {useBuyerFacingRunLabels ? (
                      secondaryText
                    ) : (
                      <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">{secondaryText}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div id={`${controlId}-listbox`} role="status" aria-live="polite" className={popupContainerClass}>
            {loading ? (
              <div className="px-3 py-2 text-neutral-500 dark:text-neutral-400">Loading reviews…</div>
            ) : null}
            {!loading && loadError !== null ? (
              <div className="px-3 py-2 text-red-700 dark:text-red-400">{loadError}</div>
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}
