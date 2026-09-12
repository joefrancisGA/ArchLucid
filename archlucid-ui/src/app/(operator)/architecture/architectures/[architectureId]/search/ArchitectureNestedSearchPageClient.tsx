"use client";

import { Suspense } from "react";

import { SearchPageClient } from "@/app/(operator)/insights/search-review-evidence/_sections/SearchPageClient";
import { architectureNestedSearchPath } from "@/lib/architecture/architecture-routes";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";

export type ArchitectureNestedSearchPageClientProps = {
  readonly architectureId: string;
};

/** Working nested Search — mounts peer search client under the architecture desk (ADR 0079 / SY-42). */
export function ArchitectureNestedSearchPageClient(
  props: ArchitectureNestedSearchPageClientProps,
): React.JSX.Element {
  const architectureId = props.architectureId.trim();
  const buyerShell = isBuyerPolishedOperatorShellEnv();
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  return (
    <Suspense fallback={null}>
      <SearchPageClient
        buyerShell={buyerShell}
        isDemo={isDemo}
        basePathname={architectureNestedSearchPath(architectureId)}
        pinnedArchitectureId={architectureId}
      />
    </Suspense>
  );
}
