import { Suspense } from "react";

import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";

import { SearchPageClient } from "./_sections/SearchPageClient";

export default async function SearchPage() {
  const buyerShell = isBuyerPolishedOperatorShellEnv();
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  return (
    <Suspense fallback={null}>
      <SearchPageClient buyerShell={buyerShell} isDemo={isDemo} />
    </Suspense>
  );
}
