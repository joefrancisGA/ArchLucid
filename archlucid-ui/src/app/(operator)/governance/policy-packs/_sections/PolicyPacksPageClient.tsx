"use client";

import { PolicyPacksPageView } from "./PolicyPacksPageView";
import type { PolicyPacksPageServerLoad } from "./load-policy-packs-page-data";
import { usePolicyPacksPage } from "./use-policy-packs-page";

type PolicyPacksPageClientProps = {
  readonly loaded: PolicyPacksPageServerLoad;
};

export function PolicyPacksPageClient(props: PolicyPacksPageClientProps) {
  const model = usePolicyPacksPage(props.loaded);

  return <PolicyPacksPageView model={model} />;
}
