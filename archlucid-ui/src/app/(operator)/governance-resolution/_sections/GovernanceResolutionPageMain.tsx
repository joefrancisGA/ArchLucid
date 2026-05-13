"use client";

import { GovernanceResolutionPageView } from "./GovernanceResolutionPageView";
import { useGovernanceResolutionPage } from "./use-governance-resolution-page";

export function GovernanceResolutionPageMain() {
  const model = useGovernanceResolutionPage();

  return <GovernanceResolutionPageView model={model} />;
}
