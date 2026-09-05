"use client";

import { useGovernanceWorkflowPageMutations } from "./use-governance-workflow-page-mutations";
import { useGovernanceWorkflowPageTabs } from "./use-governance-workflow-page-tabs";

export function useGovernanceWorkflowPage() {
  const mutations = useGovernanceWorkflowPageMutations();
  const tabs = useGovernanceWorkflowPageTabs(mutations);

  return {
    ...mutations,
    ...tabs,
  };
}

export type GovernanceWorkflowPageModel = ReturnType<typeof useGovernanceWorkflowPage>;
