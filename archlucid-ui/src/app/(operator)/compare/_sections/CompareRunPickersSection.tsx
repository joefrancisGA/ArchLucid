import { EmptyState } from "@/components/EmptyState";
import { RunIdPicker } from "@/components/RunIdPicker";
import { COMPARE_WAITING } from "@/lib/empty-state-presets";
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
  onCompare: () => void;
  onSummarizeForSponsor: () => void;
  onLeftRunPicked: (summary: RunSummary | null) => void;
  onRightRunPicked: (summary: RunSummary | null) => void;
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
    onCompare,
    onSummarizeForSponsor,
    onLeftRunPicked,
    onRightRunPicked,
  } = props;

  return (
    <section className="scroll-mt-8 space-y-4" aria-labelledby="compare-select-heading">
      <h2 id="compare-select-heading" className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">
        Select reviews to compare
      </h2>
      <div className="grid max-w-3xl gap-3">
        <RunIdPicker
          preferAutoPick={false}
          label={leftPickerLabel}
          placeholder="Choose a baseline review"
          value={leftRunId}
          onChange={onLeftRunIdChange}
          inputId="compare-left-run-id"
          forCompare
          onRunPicked={onLeftRunPicked}
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
        />
        {rightFootnote !== null ? (
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Showing:</span> {rightFootnote}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
            onClick={() => void onCompare()}
            disabled={loading || !leftTrim || !rightTrim}
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
            disabled={aiLoading || !leftTrim || !rightTrim}
          >
            {aiLoading ? "Summarizing…" : "Summarize for sponsor"}
          </button>
        </div>
      </div>

      {(!leftTrim || !rightTrim) && <EmptyState {...COMPARE_WAITING} />}
    </section>
  );
}
