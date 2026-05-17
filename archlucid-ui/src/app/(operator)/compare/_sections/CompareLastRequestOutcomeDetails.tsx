import { compareRunHeadingLabel } from "@/lib/compare-run-display";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { GoldenManifestComparison } from "@/types/comparison";
import type { RunComparison, RunSummary } from "@/types/authority";
import { outcomeLabel, type ComparedPair } from "@/app/(operator)/compare/_sections/compare-page-helpers";

export type CompareLastRequestOutcomeDetailsProps = {
  pairAligned: boolean;
  loading: boolean;
  lastComparedPair: ComparedPair | null;
  showStaleInputsWarning: boolean;
  leftPickedSummary: RunSummary | null;
  rightPickedSummary: RunSummary | null;
  golden: GoldenManifestComparison | null;
  goldenFailure: ApiLoadFailureState | null;
  goldenMalformed: string | null;
  result: RunComparison | null;
  legacyFailure: ApiLoadFailureState | null;
  legacyMalformed: string | null;
  buyerPolished?: boolean;
};

export function CompareLastRequestOutcomeDetails(props: CompareLastRequestOutcomeDetailsProps) {
  const {
    pairAligned,
    loading,
    lastComparedPair,
    showStaleInputsWarning,
    leftPickedSummary,
    rightPickedSummary,
    golden,
    goldenFailure,
    goldenMalformed,
    result,
    legacyFailure,
    legacyMalformed,
    buyerPolished = false,
  } = props;

  if (lastComparedPair === null || !pairAligned || loading) {
    return null;
  }

  const summarizeCue = buyerPolished ? "Summarize for leadership" : "Summarize for sponsor";

  return (
    <details
      className="mt-6 max-w-3xl rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/50"
      aria-label="Comparison request outcome"
      open={buyerPolished ? false : showStaleInputsWarning}
    >
      <summary className="cursor-pointer text-base font-semibold text-neutral-900 dark:text-neutral-100">
        {buyerPolished ? "Comparison details (technical appendix)" : "Last compare request (technical)"}
      </summary>
      <div className="mt-3">
        <p className="mb-2.5 text-sm text-neutral-600 dark:text-neutral-400">
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            {compareRunHeadingLabel(lastComparedPair.left, leftPickedSummary)}
          </span>
          <span className="mx-1.5 text-neutral-400 dark:text-neutral-500">→</span>
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            {compareRunHeadingLabel(lastComparedPair.right, rightPickedSummary)}
          </span>
          <span className="sr-only">
            (technical IDs: {lastComparedPair.left} → {lastComparedPair.right})
          </span>
        </p>
        <dl className="m-0 grid grid-cols-[minmax(10rem,14rem)_1fr] gap-x-3 gap-y-1.5 text-sm">
          <dt className="m-0 text-neutral-500 dark:text-neutral-400">Manifest comparison</dt>
          <dd className="m-0 text-neutral-800 dark:text-neutral-200">
            {outcomeLabel({
              hasValue: golden !== null,
              failure: goldenFailure,
              malformed: goldenMalformed,
            })}
          </dd>
          <dt className="m-0 text-neutral-500 dark:text-neutral-400">Supplementary review / manifest diff</dt>
          <dd className="m-0 text-neutral-800 dark:text-neutral-200">
            {outcomeLabel({
              hasValue: result !== null,
              failure: legacyFailure,
              malformed: legacyMalformed,
            })}
          </dd>
        </dl>
        <p className="mb-0 mt-2.5 text-xs text-neutral-500 dark:text-neutral-400">
          AI explanation is not included here—use <strong>{summarizeCue}</strong> for that pair.
        </p>
      </div>
    </details>
  );
}
