"use client";

import { Suspense } from "react";

import { AskPageContent } from "@/app/(operator)/insights/ask-review-questions/_sections/AskPageContent";
import { AskSuspenseFallback } from "@/app/(operator)/insights/ask-review-questions/_sections/AskSuspenseFallback";
import { architectureNestedAskPath } from "@/lib/architecture/architecture-routes";

export type ArchitectureNestedAskPageClientProps = {
  readonly architectureId: string;
};

/** Working nested Ask — mounts peer Ask client under the architecture desk (ADR 0079 / SY-36). */
export function ArchitectureNestedAskPageClient(
  props: ArchitectureNestedAskPageClientProps,
): React.JSX.Element {
  const architectureId = props.architectureId.trim();

  return (
    <Suspense fallback={<AskSuspenseFallback />}>
      <AskPageContent
        basePathname={architectureNestedAskPath(architectureId)}
        pinnedArchitectureId={architectureId}
      />
    </Suspense>
  );
}
