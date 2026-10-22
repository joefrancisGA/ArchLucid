"use client";

import { GovernanceWorkflowPageShell } from "./GovernanceWorkflowPageShell";
import { useGovernanceWorkflowPage } from "./use-governance-workflow-page";
import { useGovernanceEnvironmentCatalogQuery } from "@/hooks/use-governance-environment-catalog-query";

export type { FocusSubmitSectionResult } from "./governance-focus-submit-result";

export function GovernanceWorkflowPageContent() {
  const model = useGovernanceWorkflowPage();
  const environmentCatalogQuery = useGovernanceEnvironmentCatalogQuery();

  return (
    <GovernanceWorkflowPageShell
      model={model}
      environmentCatalog={environmentCatalogQuery.data}
    />
  );
}
