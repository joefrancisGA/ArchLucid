"use client";

import { GovernanceResolutionPageView } from "./GovernanceResolutionPageView";
import type { GovernanceResolutionPageServerLoad } from "./load-governance-resolution-page-data";
import { useGovernanceResolutionPage } from "./use-governance-resolution-page";

type GovernanceResolutionPageClientProps = {
  readonly loaded: GovernanceResolutionPageServerLoad;
};

export function GovernanceResolutionPageClient(props: GovernanceResolutionPageClientProps) {
  const model = useGovernanceResolutionPage(props.loaded);

  return <GovernanceResolutionPageView model={model} />;
}
