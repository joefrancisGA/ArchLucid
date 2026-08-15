"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactElement } from "react";

import { ArtifactIntegrityTechnicalDetails } from "@/components/ArtifactIntegrityTechnicalDetails";
import { ArtifactListTable } from "@/components/ArtifactListTable";
import {
  DELIVERABLE_TAB_ARB_BUCKETS,
  DELIVERABLE_TAB_SPONSOR_BUCKETS,
  sponsorArtifactAudienceBucket,
  type SponsorArtifactAudienceBucket,
} from "@/lib/artifact-review-helpers";
import type { ArtifactDescriptor } from "@/types/authority";

function artifactsMatchingBuckets(
  artifacts: readonly ArtifactDescriptor[],
  buckets: readonly SponsorArtifactAudienceBucket[],
): ArtifactDescriptor[] {
  const bucketSet = new Set<SponsorArtifactAudienceBucket>(buckets);

  return [...artifacts].filter((a) => bucketSet.has(sponsorArtifactAudienceBucket(a.artifactType)));
}

export function BuyerDeliverablesArtifactTabs(props: {
  readonly manifestId: string;
  readonly runId: string;
  readonly artifacts: readonly ArtifactDescriptor[];
}): ReactElement {
  const { manifestId, runId, artifacts } = props;

  const sortedAll = [...artifacts].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const execRows = artifactsMatchingBuckets(sortedAll, DELIVERABLE_TAB_SPONSOR_BUCKETS);
  const arbRows = artifactsMatchingBuckets(sortedAll, DELIVERABLE_TAB_ARB_BUCKETS);

  return (
    <div className="w-full min-w-0 space-y-4" data-testid="buyer-deliverables-artifact-tabs">
      <section className="space-y-3" data-testid="buyer-deliverables-panel-sponsor">
        <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Sponsor and sponsor artifacts
        </h3>
        {execRows.length === 0 ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            No sponsor or sponsor-scoped outputs are listed for this review in this view.
          </p>
        ) : (
          <ArtifactListTable
            manifestId={manifestId}
            runId={runId}
            artifacts={execRows}
            sponsorMode
            audienceSections
            deliverablesBucketAllowlist={DELIVERABLE_TAB_SPONSOR_BUCKETS}
            omitIntegrityDetails
            audienceHeadingLevel={4}
          />
        )}
      </section>

      <section className="space-y-3" data-testid="buyer-deliverables-panel-arb">
        <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Architecture review board artifacts
        </h3>
        {arbRows.length === 0 ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            No architecture review board or audit-scoped outputs are listed for this review in this view.
          </p>
        ) : (
          <ArtifactListTable
            manifestId={manifestId}
            runId={runId}
            artifacts={arbRows}
            sponsorMode
            audienceSections
            deliverablesBucketAllowlist={DELIVERABLE_TAB_ARB_BUCKETS}
            omitIntegrityDetails
            audienceHeadingLevel={4}
          />
        )}
      </section>

      <ArtifactIntegrityTechnicalDetails artifacts={sortedAll} />
    </div>
  );
}
