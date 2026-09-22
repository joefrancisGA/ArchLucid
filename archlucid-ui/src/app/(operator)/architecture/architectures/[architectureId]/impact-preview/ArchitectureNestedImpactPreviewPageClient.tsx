"use client";

import { Suspense } from "react";

import { EvolutionReviewPageClient } from "@/app/(operator)/insights/impact-preview/_sections/EvolutionReviewPageClient";
import type { EvolutionReviewPageServerLoad } from "@/app/(operator)/insights/impact-preview/_sections/load-evolution-review-page-data";
import { ImpactPreviewSetupSkeleton } from "@/app/(operator)/insights/impact-preview/_sections/ImpactPreviewSetupSkeleton";
import { ArchitectureNestedToolScopeSeed } from "@/components/architecture/ArchitectureNestedToolScopeSeed";
import { architectureNestedImpactPreviewPath } from "@/lib/architecture/architecture-routes";

export type ArchitectureNestedImpactPreviewPageClientProps = {
  readonly architectureId: string;
  readonly loaded: EvolutionReviewPageServerLoad;
};

/** Working nested Impact preview — policy cheap envelope under the architecture desk (SN-007 / ADR 0092). */
export function ArchitectureNestedImpactPreviewPageClient(
  props: ArchitectureNestedImpactPreviewPageClientProps,
): React.JSX.Element {
  const architectureId = props.architectureId.trim();

  return (
    <Suspense fallback={<ImpactPreviewSetupSkeleton />}>
      <ArchitectureNestedToolScopeSeed architectureId={architectureId} queryParam="architectureId" />
      <EvolutionReviewPageClient
        loaded={props.loaded}
        basePathname={architectureNestedImpactPreviewPath(architectureId)}
        pinnedArchitectureId={architectureId}
        nestedPolicyEnvelopeEntry
      />
    </Suspense>
  );
}
