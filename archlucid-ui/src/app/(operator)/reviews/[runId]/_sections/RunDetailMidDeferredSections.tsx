import { ChangesSinceLastReviewBanner } from "@/components/ChangesSinceLastReviewBanner";
import { RunSavingsSummary } from "@/components/RunSavingsSummary";

import { loadRunDetailMidDeferredModel } from "./load-run-detail-deferred-model";
import type { RunDetailDeferredSectionContext } from "./run-detail-page-model";

type RunDetailMidDeferredSectionsProps = {
  readonly context: RunDetailDeferredSectionContext;
};

/** Streams compare banner and savings summary after critical run-detail chrome paints. */
export async function RunDetailMidDeferredSections(
  props: RunDetailMidDeferredSectionsProps,
): Promise<React.JSX.Element | null> {
  const deferred = await loadRunDetailMidDeferredModel(props.context);

  if (deferred.changesSinceLastReviewBanner === null && deferred.savingsSummary === null) {
    return null;
  }

  return (
    <>
      {deferred.changesSinceLastReviewBanner !== null ? (
        <ChangesSinceLastReviewBanner
          priorReviewDateLabel={deferred.changesSinceLastReviewBanner.priorReviewDateLabel}
          priorRunId={deferred.changesSinceLastReviewBanner.priorRunId}
          currentRunId={deferred.changesSinceLastReviewBanner.currentRunId}
          copy={deferred.changesSinceLastReviewBanner.copy}
        />
      ) : null}
      {deferred.savingsSummary !== null ? <RunSavingsSummary model={deferred.savingsSummary} /> : null}
    </>
  );
}
