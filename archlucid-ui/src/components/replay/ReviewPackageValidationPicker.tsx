"use client";

import { cn } from "@/lib/utils";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REPLAY_PACKAGE_SELECTOR_HELPER,
  REPLAY_PACKAGE_SELECTOR_INLINE_HINT,
} from "@/lib/replay-validation-copy";
import {
  formatLastValidationOutcomeLabel,
  matchesReviewPackageValidationSearch,
  toReviewPackageValidationRow,
} from "@/lib/review-package-validation-picker";
import type { ReplayValidationOutcome } from "@/lib/replay-validation-workflow";
import type { RunSummary } from "@/types/authority";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";

export type ReviewPackageValidationPickerProps = {
  readonly value: string;
  readonly onChange: (runId: string) => void;
  readonly onRunPicked?: (summary: RunSummary) => void;
  readonly lastValidationByRunId?: Readonly<Record<string, ReplayValidationOutcome>>;
  readonly inputId?: string;
  readonly disabled?: boolean;
};

export function ReviewPackageValidationPicker(props: ReviewPackageValidationPickerProps) {
  const { value, onChange, onRunPicked, lastValidationByRunId = {}, inputId, disabled = false } = props;
  const generatedId = useId();
  const controlId = inputId ?? `review-package-validation-picker-${generatedId}`;
  const hintId = `${controlId}-hint`;
  const inlineHintId = `${controlId}-inline-hint`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const prefillAppliedRef = useRef(false);

  const runsQuery = useAskProjectRunsQuery("default", { committedOnly: true });
  const runs = runsQuery.data?.items ?? [];
  const loading = runsQuery.isPending || runsQuery.isFetching;
  const loadError =
    runsQuery.isError
      ? "Could not load finalized reviews."
      : runsQuery.data?.loadError
        ? "Could not load finalized reviews."
        : null;

  const rows = useMemo(
    () =>
      runs.map((run) =>
        toReviewPackageValidationRow(
          run,
          formatLastValidationOutcomeLabel(lastValidationByRunId[run.runId] ?? null),
        ),
      ),
    [lastValidationByRunId, runs],
  );

  const selectedRow = useMemo(
    () => rows.find((row) => row.run.runId === value.trim()) ?? null,
    [rows, value],
  );

  useEffect(() => {
    if (selectedRow !== null) {
      setQuery(selectedRow.reviewName);
      return;
    }

    if (value.trim().length === 0) {
      setQuery("");
      return;
    }

    setQuery(value);
  }, [selectedRow, value]);

  useEffect(() => {
    if (prefillAppliedRef.current) {
      return;
    }

    if (value.trim().length === 0) {
      return;
    }

    prefillAppliedRef.current = true;
  }, [value]);

  const filtered = useMemo(() => {
    return rows.filter((row) => matchesReviewPackageValidationSearch(row, query)).slice(0, 12);
  }, [query, rows]);

  const recentRows = useMemo(() => rows.slice(0, 5), [rows]);
  const showInlineHint = value.trim().length === 0;

  const popupContainerClass = cn(
    "absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-md dark:border-neutral-700 dark:bg-neutral-900",
    OPERATOR_TYPOGRAPHY.body,
  );

  return (
    <div className="space-y-2">
      <div className="relative max-w-none">
        <Label htmlFor={controlId} className={cn("mb-1 block font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
          Review
        </Label>
        <p id={hintId} className={cn("m-0 mb-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {REPLAY_PACKAGE_SELECTOR_HELPER}
        </p>
        <Input
          id={controlId}
          role="combobox"
          value={query}
          placeholder="Search finalized reviews"
          disabled={disabled}
          autoComplete="off"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? `${controlId}-listbox` : undefined}
          aria-describedby={showInlineHint ? `${hintId} ${inlineHintId}` : hintId}
          onFocus={() => {
            setOpen(true);
            void runsQuery.refetch();
          }}
          onClick={() => {
            setOpen(true);
            void runsQuery.refetch();
          }}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false);
            }, 150);
          }}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            onChange(next);
            setOpen(true);
          }}
          data-testid="review-package-validation-picker-input"
        />

        {showInlineHint ? (
          <p id={inlineHintId} className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {REPLAY_PACKAGE_SELECTOR_INLINE_HINT}
          </p>
        ) : null}

        {open && (filtered.length > 0 || loadError !== null || loading) ? (
          loading ? (
            <div role="status" aria-live="polite" className={popupContainerClass}>
              <div className="px-3 py-2 text-neutral-500 dark:text-neutral-400">Loading finalized packages…</div>
            </div>
          ) : loadError !== null ? (
            <div role="status" aria-live="polite" className={popupContainerClass}>
              <div className="px-3 py-2 text-red-700 dark:text-red-400">{loadError}</div>
            </div>
          ) : (
            <ul id={`${controlId}-listbox`} role="listbox" className={popupContainerClass} data-testid="review-package-validation-picker-list">
              {filtered.map((row) => (
                <li key={row.run.runId} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={row.run.runId === value.trim()}
                    className={cn(
                      "flex w-full flex-col gap-1 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800",
                      row.run.runId === value.trim() && "bg-[var(--al-layer-hover)] dark:bg-neutral-800/80",
                    )}
                    data-testid={`review-package-validation-option-${row.run.runId}`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => {
                      setQuery(row.reviewName);
                      onChange(row.run.runId);
                      onRunPicked?.(row.run);
                      setOpen(false);
                    }}
                  >
                    <span className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                      {row.architectureName} · {row.reviewName}
                    </span>
                    <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                      Finalized {row.finalizedDateLabel} · {row.statusLabel} · Owner {row.ownerLabel} · Last validation{" "}
                      {row.lastValidationLabel}
                    </span>
                    <span className="sr-only">Review ID {row.run.runId}</span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>

      {recentRows.length > 0 && value.trim().length === 0 ? (
        <div className="space-y-1" data-testid="review-package-validation-recent">
          <p className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.label)}>
            Recent finalized packages
          </p>
          <ul className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
            {recentRows.map((row) => (
              <li key={row.run.runId}>
                <button
                  type="button"
                  className={cn(OPERATOR_LINK.nav, "text-left")}
                  onClick={() => {
                    setQuery(buyerFacingReviewTitleFromSummary(row.run));
                    onChange(row.run.runId);
                    onRunPicked?.(row.run);
                  }}
                >
                  {row.reviewName}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
