"use client";

import { CollabRecentActorPresenceStrip } from "@/components/CollabRecentActorPresenceStrip";
import { SponsorStorySynopsisFromCounts } from "@/components/operator/SponsorStorySynopsisPanel";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import type { CollabRecentActor } from "@/lib/collab-recent-actor-presence";
import type { SponsorStoryDispositionCounts } from "@/lib/sponsor-story-synopsis";

type FindingInspectStickinessSummaryProps = {
  readonly recentDispositionActors: readonly CollabRecentActor[];
  readonly mutationDisabledHintId: string;
  readonly mutationDisabledReason: string | null;
  readonly sponsorSynopsisPackageTitle: string | null;
  readonly sponsorSynopsisCounts: SponsorStoryDispositionCounts;
  readonly runId: string;
  readonly statusMessage: string | null;
  readonly errorMessage: string | null;
};

export function FindingInspectStickinessSummary(props: FindingInspectStickinessSummaryProps) {
  const {
    recentDispositionActors,
    mutationDisabledHintId,
    mutationDisabledReason,
    sponsorSynopsisPackageTitle,
    sponsorSynopsisCounts,
    runId,
    statusMessage,
    errorMessage,
  } = props;

  return (
    <>
      <CollabRecentActorPresenceStrip recentActors={recentDispositionActors} />
      <WhyDisabledCtaHint
        id={mutationDisabledHintId}
        reason={mutationDisabledReason}
        testId={mutationDisabledHintId}
      />
      <SponsorStorySynopsisFromCounts
        packageTitle={sponsorSynopsisPackageTitle}
        counts={sponsorSynopsisCounts}
        sponsorHandoffHref={`/architecture/reviews/${encodeURIComponent(runId)}?reviewTab=review-package`}
      />
      {statusMessage ? (
        <p className="m-0 text-al-text-secondary dark:text-neutral-300" role="status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="m-0 text-red-700 dark:text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </>
  );
}
