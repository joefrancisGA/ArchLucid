import { cn } from "@/lib/utils";
import { RunIdPicker } from "@/components/RunIdPicker";
import { BUYER_COMPARE_CHANGE_REVIEWS_SUMMARY } from "@/lib/buyer-polish-copy";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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

  const compareActionsDisabled = loading || !leftTrim || !rightTrim || sameCanonicalRunIdsBlocked;
  const showSummarizeForSponsor = (pairAligned && !loading) || aiLoading;
  const showSelectionHelper = !leftTrim || !rightTrim;

  const pickerFields = (
    <>
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
          committedOnly={useBuyerFacingRunLabels}
          onRunPicked={onLeftRunPicked}
          useBuyerFacingRunLabels={useBuyerFacingRunLabels}
        />
        {leftFootnote !== null ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">Showing:</span> {leftFootnote}
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
          committedOnly={useBuyerFacingRunLabels}
          onRunPicked={onRightRunPicked}
          useBuyerFacingRunLabels={useBuyerFacingRunLabels}
        />
        {rightFootnote !== null ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">Showing:</span> {rightFootnote}
          </p>
        ) : null}
        {!useBuyerFacingRunLabels ? (
          <details
            className={cn(
              "rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
              Advanced: enter review IDs manually
            </summary>
            <p className={cn("mt-2 m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Type or paste a review ID in either field above when the review is not in the recent list (for example an
              in-progress or archived review).
            </p>
          </details>
        ) : null}
        {sameCanonicalRunIdsBlocked ? (
          <p
            role="alert"
            className={cn(
              "m-0 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            These two selections resolve to the same review. Choose a different prior or later review to compare.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-testid="compare-submit-button"
            className={cn(
              "rounded-md border border-neutral-300 bg-white px-4 py-2.5 font-medium text-al-text-primary shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:hover:bg-neutral-800",
              OPERATOR_TYPOGRAPHY.button,
            )}
            onClick={() => void onCompare()}
            disabled={compareActionsDisabled}
          >
            {loading ? "Comparing…" : "Compare reviews"}
          </button>
          {showSummarizeForSponsor ? (
            <button
              type="button"
              className={cn(
              "rounded-md border border-neutral-300 bg-white px-4 py-2.5 font-medium text-al-text-primary shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:hover:bg-neutral-800",
              OPERATOR_TYPOGRAPHY.button,
            )}
              onClick={() => void onSummarizeForSponsor()}
              disabled={aiLoading}
            >
              {aiLoading ? "Summarizing…" : summarizeButtonLabel}
            </button>
          ) : null}
        </div>
        {showSelectionHelper ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Choose a baseline and updated review to continue.
          </p>
        ) : null}
      </div>
    </>
  );

  if (collapseBelowResults) {
    return (
      <details className="scroll-mt-8 max-w-3xl rounded-lg border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30">
        <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
          {BUYER_COMPARE_CHANGE_REVIEWS_SUMMARY}
        </summary>
        <section className="mt-3 space-y-4" aria-label="Change compared reviews">
          {pickerFields}
        </section>
      </details>
    );
  }

  return (
    <section className="scroll-mt-8 space-y-4" aria-label="Select reviews to compare">
      {pickerFields}
    </section>
  );
}
