"use client";

import { Suspense } from "react";

import { GovernanceFindingsQueueClientDeferred } from "@/app/(operator)/governance/findings/governance-findings-deferred-chunks";
import { GovernanceFindingsQueueSkeleton } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueSkeleton";
import { ArchitectureNestedToolScopeSeed } from "@/components/architecture/ArchitectureNestedToolScopeSeed";
import { WorkingArchitectureNestedToolShell } from "@/components/architecture/WorkingArchitectureNestedToolShell";
import type { InhabitedFindingsTrailBundleSnapshot } from "@/lib/inhabit/inhabited-findings-trail-bundle";

export type ArchitectureNestedFindingsPageClientProps = {
  readonly architectureId: string;
  readonly inhabitedFindingsInitialTrailBundle?: InhabitedFindingsTrailBundleSnapshot | null;
};

/** Working nested Findings — mounts findings queue under the architecture desk (ADR 0079 / SN-023). */
export function ArchitectureNestedFindingsPageClient(
  props: ArchitectureNestedFindingsPageClientProps,
): React.JSX.Element {
  const architectureId = props.architectureId.trim();

  return (
    <WorkingArchitectureNestedToolShell architectureId={architectureId} toolLabel="Findings">
      <Suspense fallback={<GovernanceFindingsQueueSkeleton />}>
        <ArchitectureNestedToolScopeSeed architectureId={architectureId} queryParam="architectureId" />
        <GovernanceFindingsQueueClientDeferred
          inhabitedFindingsInitialTrailBundle={props.inhabitedFindingsInitialTrailBundle ?? null}
        />
      </Suspense>
    </WorkingArchitectureNestedToolShell>
  );
}
