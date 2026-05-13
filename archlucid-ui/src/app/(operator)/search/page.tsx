import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

import { SearchPageClient } from "./_sections/SearchPageClient";

export default async function SearchPage() {
  const buyerShell = isBuyerPolishedOperatorShellEnv();
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  return <SearchPageClient buyerShell={buyerShell} isDemo={isDemo} />;
}
