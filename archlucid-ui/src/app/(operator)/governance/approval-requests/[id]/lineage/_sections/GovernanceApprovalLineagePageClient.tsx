"use client";

import type { GovernanceApprovalLineagePageServerLoad } from "./load-governance-approval-lineage-page-data";
import { GovernanceApprovalLineagePageView } from "./GovernanceApprovalLineagePageView";
import { useGovernanceApprovalLineagePage } from "./use-governance-approval-lineage-page";

type Props = {
  readonly loaded: GovernanceApprovalLineagePageServerLoad;
};

/** Client shell; lineage is prefetched from `page.tsx`; Retry buttons call `load()`. */
export function GovernanceApprovalLineagePageClient(props: Props) {
  const model = useGovernanceApprovalLineagePage(props.loaded);

  return <GovernanceApprovalLineagePageView model={model} />;
}
