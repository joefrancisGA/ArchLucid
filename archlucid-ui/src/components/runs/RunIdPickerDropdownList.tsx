"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { RunSummary } from "@/types/authority";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { runSummaryDisplayLabel } from "@/lib/runs/run-summary-display-label";

import { RunIdPickerLoadFailure } from "./RunIdPickerLoadFailure";

function truncate(text: string, max: number): string {
  const t = text.trim();

  if (t.length <= max)
  {
    return t;
  }

  return `${t.slice(0, max - 1)}…`;
}

export type RunIdPickerDropdownListProps = {
  readonly controlId: string;
  readonly popupContainerClass: string;
  readonly popupUsesListbox: boolean;
  readonly loading: boolean;
  readonly loadError: string | null;
  readonly showNoMatches: boolean;
  readonly filtered: readonly RunSummary[];
  readonly hiddenMatchCount: number;
  readonly activeIndex: number;
  readonly value: string;
  readonly useBuyerFacingRunLabels: boolean;
  readonly retrying: boolean;
  readonly onRetry: () => void;
  readonly onSelectRun: (run: RunSummary) => void;
};

export function RunIdPickerDropdownList({
  controlId,
  popupContainerClass,
  popupUsesListbox,
  loading,
  loadError,
  showNoMatches,
  filtered,
  hiddenMatchCount,
  activeIndex,
  value,
  useBuyerFacingRunLabels,
  retrying,
  onRetry,
  onSelectRun,
}: RunIdPickerDropdownListProps) {
  if (popupUsesListbox) {
    return (
      <ul
        id={`${controlId}-listbox`}
        role="listbox"
        className={popupContainerClass}
        onMouseDown={(event) => {
          event.preventDefault();
        }}
      >
        {loadError !== null ? (
          <li role="presentation">
            <RunIdPickerLoadFailure
              message={loadError}
              retrying={retrying}
              onRetry={onRetry}
            />
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
                  onSelectRun(r);
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
    );
  }

  return (
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
        <RunIdPickerLoadFailure
          message={loadError}
          retrying={retrying}
          onRetry={onRetry}
        />
      ) : null}
      {showNoMatches ? (
        <div className="px-3 py-2 text-neutral-700 dark:text-neutral-300" data-testid="run-id-picker-no-matches">
          No matching reviews. Paste a review id directly in this field to compare an older or in-progress review.
        </div>
      ) : null}
    </div>
  );
}
