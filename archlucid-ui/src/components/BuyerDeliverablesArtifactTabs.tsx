"use client";

import type { ReactElement } from "react";
import { useMemo, useState } from "react";

import { ArtifactIntegrityTechnicalDetails } from "@/components/ArtifactIntegrityTechnicalDetails";
import { ArtifactListTable } from "@/components/ArtifactListTable";
import {
  DELIVERABLE_TAB_ARB_BUCKETS,
  DELIVERABLE_TAB_EXECUTIVE_BUCKETS,
  sponsorArtifactAudienceBucket,
  type SponsorArtifactAudienceBucket,
} from "@/lib/artifact-review-helpers";
import { cn } from "@/lib/utils";
import type { ArtifactDescriptor } from "@/types/authority";

type TabId = "executive" | "arb";

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
  const [tab, setTab] = useState<TabId>("executive");

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
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Deliverable groups">
        {(["executive", "arb"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-semibold transition",
              tab === id
                ? "border-teal-700 bg-teal-50 text-teal-950 dark:border-teal-400 dark:bg-teal-950/40 dark:text-teal-50"
                : "border-transparent bg-neutral-100 text-neutral-600 hover:border-neutral-300 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600",
            )}
            onClick={() => {
              setTab(id);
            }}
          >
            {id === "executive" ? "Executive and sponsor artifacts" : "Architecture review board artifacts"}
          </button>
        ))}
      </div>

      {tab === "executive" ? (
        execRows.length === 0 ? (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
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
        )
      ) : arbRows.length === 0 ? (
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
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

      <ArtifactIntegrityTechnicalDetails artifacts={sortedAll} />
    </div>
  );
}
