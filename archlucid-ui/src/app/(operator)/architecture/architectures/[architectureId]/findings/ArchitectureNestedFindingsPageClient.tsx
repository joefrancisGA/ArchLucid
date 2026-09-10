"use client";

import { Suspense } from "react";

import { GovernanceFindingsQueueClientDeferred } from "@/app/(operator)/governance/findings/governance-findings-deferred-chunks";
import { GovernanceFindingsQueueSkeleton } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueSkeleton";
import { ArchitectureNestedToolScopeSeed } from "@/components/architecture/ArchitectureNestedToolScopeSeed";

export type ArchitectureNestedFindingsPageClientProps = {
  readonly architectureId: string;
};

/** Working nested Findings — mounts findings queue under the architecture desk (ADR 0079 / SY-43). */
export function ArchitectureNestedFindingsPageClient(
  props: ArchitectureNestedFindingsPageClientProps,
): React.JSX.Element {
  const architectureId = props.architectureId.trim();

  return (
    <Suspense fallback={<GovernanceFindingsQueueSkeleton />}>
      <ArchitectureNestedToolScopeSeed architectureId={architectureId} queryParam="architectureId" />
      <GovernanceFindingsQueueClientDeferred />
    </Suspense>
  );
}
