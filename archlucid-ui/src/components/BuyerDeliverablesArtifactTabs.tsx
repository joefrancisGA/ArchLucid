"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactElement } from "react";
import { useMemo } from "react";

import { ArtifactIntegrityTechnicalDetails } from "@/components/ArtifactIntegrityTechnicalDetails";
import { ArtifactListTable } from "@/components/ArtifactListTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DELIVERABLE_TAB_ARB_BUCKETS,
  DELIVERABLE_TAB_EXECUTIVE_BUCKETS,
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

/**
 * Buyer-polished run detail: two top-level groupings instead of five stacked audience sections.
 */
export function BuyerDeliverablesArtifactTabs(props: {
  readonly manifestId: string;
  readonly runId: string;
  readonly artifacts: readonly ArtifactDescriptor[];
}): ReactElement {
  const { manifestId, runId, artifacts } = props;

  const sortedAll = useMemo(
    () => [...artifacts].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [artifacts],
  );

  const execRows = useMemo(
    () => artifactsMatchingBuckets(sortedAll, DELIVERABLE_TAB_EXECUTIVE_BUCKETS),
    [sortedAll],
  );

  const arbRows = useMemo(() => artifactsMatchingBuckets(sortedAll, DELIVERABLE_TAB_ARB_BUCKETS), [sortedAll]);

  return (
    <div className="space-y-4" data-testid="buyer-deliverables-artifact-tabs">
      <Tabs defaultValue="executive">
        <TabsList aria-label="Deliverable groups" className="gap-2 border-0">
          <TabsTrigger value="executive" className="rounded-md border px-3 py-1.5">
            Executive and sponsor artifacts
          </TabsTrigger>
          <TabsTrigger value="arb" className="rounded-md border px-3 py-1.5">
            Architecture review board artifacts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="pt-4" data-testid="buyer-deliverables-panel-executive">
          {execRows.length === 0 ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              No executive or sponsor-scoped outputs are listed for this package in this view.
            </p>
          ) : (
            <ArtifactListTable
              manifestId={manifestId}
              runId={runId}
              artifacts={execRows}
              sponsorMode
              audienceSections
              deliverablesBucketAllowlist={DELIVERABLE_TAB_EXECUTIVE_BUCKETS}
              omitIntegrityDetails
            />
          )}
        </TabsContent>

        <TabsContent value="arb" className="pt-4" data-testid="buyer-deliverables-panel-arb">
          {arbRows.length === 0 ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              No architecture review board or audit-scoped outputs are listed for this package in this view.
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
            />
          )}
        </TabsContent>
      </Tabs>

      <ArtifactIntegrityTechnicalDetails artifacts={sortedAll} />
    </div>
  );
}
