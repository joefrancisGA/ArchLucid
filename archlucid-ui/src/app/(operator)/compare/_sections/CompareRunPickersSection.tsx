import { EmptyState } from "@/components/EmptyState";
import { RunIdPicker } from "@/components/RunIdPicker";
import { BUYER_COMPARE_CHANGE_REVIEWS_SUMMARY } from "@/lib/buyer-polish-copy";
import { COMPARE_WAITING, COMPARE_WAITING_BUYER } from "@/lib/empty-state-presets";
import type { RunSummary } from "@/types/authority";

export type CompareRunPickersSectionProps = {
  leftPickerLabel: string;
  rightPickerLabel: string;
  leftRunId: string;
  rightRunId: string;
  onLeftRunIdChange: (value: string) => void;
  onRightRunIdChange: (value: string) => void;
  leftFootnote: string | null;
  rightFootnote: string | null;
  leftTrim: string;
  rightTrim: string;
  loading: boolean;
  aiLoading: boolean;
  pairAligned: boolean;
  sameCanonicalRunIdsBlocked: boolean;
  onCompare: () => void;
  onSummarizeForSponsor: () => void;
  onLeftRunPicked: (summary: RunSummary | null) => void;
  onRightRunPicked: (summary: RunSummary | null) => void;
  /** Buyer shell: show review titles in inputs while retaining technical ids for requests. */
  useBuyerFacingRunLabels?: boolean;
  /** Buyer shell: replaces “Summarize for sponsor” with procurement-oriented language. */
  summarizeButtonLabel?: string;
  /** Buyer shell: collapse pickers below results when comparison is on screen. */
  collapseBelowResults?: boolean;
};

export function CompareRunPickersSection(props: CompareRunPickersSectionProps) {
  const {
    leftPickerLabel,
    rightPickerLabel,
    leftRunId,
    rightRunId,
    onLeftRunIdChange,
    onRightRunIdChange,
    leftFootnote,
    rightFootnote,
    leftTrim,
    rightTrim,
    loading,
    aiLoading,
    pairAligned,
    sameCanonicalRunIdsBlocked,
    onCompare,
    onSummarizeForSponsor,
    onLeftRunPicked,
    onRightRunPicked,
    useBuyerFacingRunLabels = false,
    summarizeButtonLabel = "Summarize for sponsor",
    collapseBelowResults = false,
  } = props;

  const pickerFields = (
    <>
      <h2 id="compare-select-heading" className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">
        {useBuyerFacingRunLabels ? BUYER_COMPARE_CHANGE_REVIEWS_SUMMARY : "Select reviews to compare"}
      </h2>
      <div className="grid max-w-3xl gap-3">
        <RunIdPicker
          preferAutoPick={false}
          autoFocus
          label={leftPickerLabel}
          placeholder="Choose a baseline review"
          value={leftRunId}
          onChange={onLeftRunIdChange}
          inputId="compare-left-run-id"
          forCompare
          onRunPicked={onLeftRunPicked}
          useBuyerFacingRunLabels={useBuyerFacingRunLabels}
        />
        {leftFootnote !== null ? (
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Showing:</span> {leftFootnote}
          </p>
        ) : null}
        <RunIdPicker
          preferAutoPick={false}
          label={rightPickerLabel}
          placeholder="Choose an updated review"
          value={rightRunId}
          onChange={onRightRunIdChange}
          inputId="compare-right-run-id"
          forCompare
          onRunPicked={onRightRunPicked}
          useBuyerFacingRunLabels={useBuyerFacingRunLabels}
        />
        {rightFootnote !== null ? (
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Showing:</span> {rightFootnote}
          </p>
        ) : null}
        {sameCanonicalRunIdsBlocked ? (
          <p
            role="alert"
            className="m-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          >
            These two selections resolve to the same review. Choose a different prior or later review to compare.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
            onClick={() => void onCompare()}
            disabled={loading || !leftTrim || !rightTrim || sameCanonicalRunIdsBlocked}
          >
            {loading ? "Comparing…" : "Compare"}
          </button>
          <button
            type="button"
            className={
              pairAligned && !loading
                ? "rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                : "rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-600 shadow-sm hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-400 dark:hover:bg-neutral-800/60"
            }
            onClick={() => void onSummarizeForSponsor()}
            disabled={aiLoading || !leftTrim || !rightTrim || sameCanonicalRunIdsBlocked}
          >
            {aiLoading ? "Summarizing…" : summarizeButtonLabel}
          </button>
        </div>
      </div>

      {(!leftTrim || !rightTrim) && (
        <EmptyState {...(useBuyerFacingRunLabels ? COMPARE_WAITING_BUYER : COMPARE_WAITING)} />
      )}
    </>
  );

  if (collapseBelowResults) {
    return (
      <details className="scroll-mt-8 max-w-3xl rounded-lg border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30">
        <summary className="cursor-pointer text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {BUYER_COMPARE_CHANGE_REVIEWS_SUMMARY}
        </summary>
        <section className="mt-3 space-y-4" aria-labelledby="compare-select-heading">
          {pickerFields}
        </section>
      </details>
    );
  }

  return (
    <section className="scroll-mt-8 space-y-4" aria-labelledby="compare-select-heading">
      {pickerFields}
    </section>
  );
}
