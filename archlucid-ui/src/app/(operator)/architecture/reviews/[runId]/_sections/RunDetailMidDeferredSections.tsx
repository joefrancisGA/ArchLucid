import {
  ChangesSinceLastReviewBannerDeferred,
  RunSavingsSummaryDeferred,
} from "./run-detail-page-view-deferred-chunks";

import { loadRunDetailMidDeferredModel } from "./load-run-detail-deferred-model";
import type { RunDetailDeferredSectionContext } from "./run-detail-page-model";

type RunDetailMidDeferredSectionsProps = {
  readonly context: RunDetailDeferredSectionContext;
  readonly includeSavingsSummary?: boolean;
};

/** Streams compare banner and savings summary after critical run-detail chrome paints. */
export async function RunDetailMidDeferredSections(
  props: RunDetailMidDeferredSectionsProps,
): Promise<React.JSX.Element | null> {
  const includeSavingsSummary = props.includeSavingsSummary ?? true;
  const deferred = await loadRunDetailMidDeferredModel(props.context);

  if (deferred.changesSinceLastReviewBanner === null && (!includeSavingsSummary || deferred.savingsSummary === null)) {
    return null;
  }

  return (
    <>
      {deferred.changesSinceLastReviewBanner !== null ? (
        <ChangesSinceLastReviewBannerDeferred
          priorReviewDateLabel={deferred.changesSinceLastReviewBanner.priorReviewDateLabel}
          priorRunId={deferred.changesSinceLastReviewBanner.priorRunId}
          currentRunId={deferred.changesSinceLastReviewBanner.currentRunId}
          copy={deferred.changesSinceLastReviewBanner.copy}
        />
      ) : null}
      {includeSavingsSummary && deferred.savingsSummary !== null ? (
        <RunSavingsSummaryDeferred
          model={deferred.savingsSummary}
          isFinalized={Boolean(props.context.manifestId)}
        />
      ) : null}
    </>
  );
}
