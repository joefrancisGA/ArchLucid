import { cn } from "@/lib/utils";
import { RunIdPicker } from "@/components/runs/RunIdPicker";
import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { BUYER_COMPARE_CHANGE_REVIEWS_SUMMARY } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { firstWhyDisabledCtaReason, whyDisabledBusy, whyDisabledIncompleteInput } from "@/lib/why-disabled-cta";
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
  /** Buyer shell: primary compare action label. */
  compareButtonLabel?: string;
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
    compareButtonLabel = "Compare two reviews",
    collapseBelowResults = false,
  } = props;

  const compareActionsDisabled = loading || !leftTrim || !rightTrim || sameCanonicalRunIdsBlocked;
  const compareDisabledReason = firstWhyDisabledCtaReason([
    loading ? whyDisabledBusy("Comparison") : null,
    !leftTrim || !rightTrim ? whyDisabledIncompleteInput("Choose a baseline and updated review to continue.") : null,
    sameCanonicalRunIdsBlocked
      ? { kind: "prerequisite", message: "These two selections resolve to the same review." }
      : null,
  ]);
  const showSummarizeForSponsor = (pairAligned && !loading) || aiLoading;
  const showSelectionHelper = !leftTrim || !rightTrim;

  const pickerFields = (
    <>
      <div className="grid gap-3">
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
          <Button
            type="button"
            variant="primary"
            data-testid="compare-submit-button"
            onClick={() => void onCompare()}
            disabled={compareActionsDisabled}
          >
            {loading ? "Comparing…" : compareButtonLabel}
          </Button>
          {showSummarizeForSponsor ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void onSummarizeForSponsor()}
              disabled={aiLoading}
            >
              {aiLoading ? "Summarizing…" : summarizeButtonLabel}
            </Button>
          ) : null}
        </div>
        <WhyDisabledCtaHint reason={compareActionsDisabled ? compareDisabledReason : null} />
        {showSelectionHelper ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Choose a baseline and updated review to continue.
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <section
      className={cn("scroll-mt-8 space-y-4", collapseBelowResults && "order-2")}
      aria-label={collapseBelowResults ? "Change compared reviews" : "Select reviews to compare"}
    >
      {collapseBelowResults ? (
        <details className="rounded-lg border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30">
          <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
            {BUYER_COMPARE_CHANGE_REVIEWS_SUMMARY}
          </summary>
          <div className="mt-3 space-y-4">{pickerFields}</div>
        </details>
      ) : (
        pickerFields
      )}
    </section>
  );
}
