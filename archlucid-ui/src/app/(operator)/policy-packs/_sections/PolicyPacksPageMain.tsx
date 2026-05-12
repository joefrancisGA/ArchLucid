"use client";

import { PolicyPacksPageView } from "./PolicyPacksPageView";
import { usePolicyPacksPage } from "./use-policy-packs-page";

export function PolicyPacksPageMain() {
  const model = usePolicyPacksPage();

  return <PolicyPacksPageView model={model} />;
}
