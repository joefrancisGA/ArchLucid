"use client";

import { Suspense } from "react";

import { GraphPageContent } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPageContent";
import { GraphSuspenseFallback } from "@/app/(operator)/insights/evidence-graph/_sections/GraphSuspenseFallback";
import { architectureNestedGraphPath } from "@/lib/architecture/architecture-routes";

export type ArchitectureNestedGraphPageClientProps = {
  readonly architectureId: string;
};

/** Working nested Evidence graph — mounts peer graph client under the architecture desk (ADR 0079 / SY-40). */
export function ArchitectureNestedGraphPageClient(
  props: ArchitectureNestedGraphPageClientProps,
): React.JSX.Element {
  const architectureId = props.architectureId.trim();

  return (
    <Suspense fallback={<GraphSuspenseFallback />}>
      <GraphPageContent
        basePathname={architectureNestedGraphPath(architectureId)}
        pinnedArchitectureId={architectureId}
      />
    </Suspense>
  );
}
