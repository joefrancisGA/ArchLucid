"use client";

import { GovernanceApprovalLineagePageView } from "./GovernanceApprovalLineagePageView";
import { useGovernanceApprovalLineagePage } from "./use-governance-approval-lineage-page";

export function GovernanceApprovalLineagePageMain() {
  const model = useGovernanceApprovalLineagePage();

  return <GovernanceApprovalLineagePageView model={model} />;
}
