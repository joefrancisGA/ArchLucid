import { cn } from "@/lib/utils";
import { compareRunHeadingLabel } from "@/lib/compare-run-display";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { GoldenManifestComparison } from "@/types/comparison";
import type { RunComparison, RunSummary } from "@/types/authority";
import { outcomeLabel, type ComparedPair } from "@/app/(operator)/insights/compare-two-reviews/_sections/compare-page-helpers";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
      className={cn(
        "mt-6 max-w-3xl rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/50",
        OPERATOR_TYPOGRAPHY.body,
      )}
      aria-label="Comparison request outcome"
      open={buyerPolished ? false : showStaleInputsWarning}
    >
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {buyerPolished ? "Comparison details (technical appendix)" : "Last compare request (technical)"}
      </summary>
      <div className="mt-3">
        <p className={cn("mb-2.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <span className="font-medium text-al-text-primary">
            {compareRunHeadingLabel(lastComparedPair.left, leftPickedSummary)}
          </span>
          <span className="mx-1.5 text-al-text-secondary">→</span>
          <span className="font-medium text-al-text-primary">
            {compareRunHeadingLabel(lastComparedPair.right, rightPickedSummary)}
          </span>
          <span className="sr-only">
            (technical IDs: {lastComparedPair.left} → {lastComparedPair.right})
          </span>
        </p>
        <dl className={cn("m-0 grid grid-cols-[minmax(10rem,14rem)_1fr] gap-x-3 gap-y-1.5", OPERATOR_TYPOGRAPHY.body)}>
          <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Review comparison</dt>
          <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {outcomeLabel({
              hasValue: golden !== null,
              failure: goldenFailure,
              malformed: goldenMalformed,
            })}
          </dd>
          <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Supplementary review / review diff</dt>
          <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {outcomeLabel({
              hasValue: result !== null,
              failure: legacyFailure,
              malformed: legacyMalformed,
            })}
          </dd>
        </dl>
        <p className={cn("mb-0 mt-2.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          AI explanation is not included her — se <strong>{summarizeCue}</strong> for that pair.
        </p>
      </div>
    </details>
  );
}
