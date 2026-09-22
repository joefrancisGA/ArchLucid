export type LostWrite401ResumePolicy = "yes" | "no";

export type LostWrite401ResumeKindRow = {
  readonly id: string;
  readonly sourceRoots: readonly string[];
  readonly resumeWrapperPresent: LostWrite401ResumePolicy;
  readonly notes: string;
};

/**
 * Livelihood mutating calls vs LP-19 401 resume wrappers (LW-003 / LW-054–062).
 * "yes" rows must keep their wrapper; shrink "no" only by adding kinds.
 */
export const LOST_WRITE_401_RESUME_KIND_INVENTORY: readonly LostWrite401ResumeKindRow[] = [
  {
    id: "finding_disposition",
    sourceRoots: ["lib/api/governance-stickiness-api-dispositions.ts"],
    resumeWrapperPresent: "yes",
    notes: "LP-19 recordFindingDispositionWith401Resume.",
  },
  {
    id: "governance_mutation_correction",
    sourceRoots: ["lib/governance/governance-mutation-correction-api.ts"],
    resumeWrapperPresent: "yes",
    notes: "LP-19 recordGovernanceMutationCorrectionWith401Resume.",
  },
  {
    id: "architecture_draft_patch",
    sourceRoots: ["hooks/use-architecture-draft-autosave-persist.ts"],
    resumeWrapperPresent: "yes",
    notes: "patchDraftRequestWith401Resume (LW-055). Offline queue is a separate path.",
  },
  {
    id: "finding_bulk_disposition",
    sourceRoots: [
      "components/usability/GovernanceFindingsBulkActions.tsx",
      "lib/api/governance-stickiness-api-dispositions.ts",
    ],
    resumeWrapperPresent: "yes",
    notes: "recordBulkFindingDispositionWith401Resume (LW-056).",
  },
  {
    id: "governance_workflow_transition",
    sourceRoots: [
      "hooks/use-governance-workflow-mutations.ts",
      "lib/api/governance-workflow-api-approvals.ts",
      "lib/api/governance-workflow-api-environments.ts",
    ],
    resumeWrapperPresent: "yes",
    notes: "submitGovernanceWorkflowTransitionWith401Resume (LW-057).",
  },
  {
    id: "architecture_review_finalize",
    sourceRoots: ["components/CommitRunButton.tsx"],
    resumeWrapperPresent: "yes",
    notes: "commitArchitectureRunWith401Resume (LW-058).",
  },
  {
    id: "policy_pack_save",
    sourceRoots: ["app/(operator)/governance/policy-packs/_sections/use-policy-packs-create-publish.ts"],
    resumeWrapperPresent: "yes",
    notes: "createPolicyPackWith401Resume; publish persists but autoReplay false (LW-059).",
  },
  {
    id: "itsm_connector_save",
    sourceRoots: [
      "app/(operator)/integrations/jira/_sections/JiraIntegrationPageClient.tsx",
      "app/(operator)/integrations/servicenow/_sections/ServiceNowIntegrationPageClient.tsx",
      "app/(operator)/integrations/azure-boards/_sections/use-azure-boards-connection-mutations.ts",
      "app/(operator)/integrations/teams/_sections/use-teams-notifications-integration-page.ts",
    ],
    resumeWrapperPresent: "yes",
    notes: "saveItsmConnectorWith401Resume for Jira, ServiceNow, Azure Boards, Teams (LW-060).",
  },
  {
    id: "architecture_share_grant",
    sourceRoots: ["components/architecture/ArchitectureIdentityDeskSharePanel.tsx"],
    resumeWrapperPresent: "yes",
    notes: "mutateArchitectureShareWith401Resume (LW-061).",
  },
  {
    id: "risk_exception_write",
    sourceRoots: ["components/governance/use-risk-exceptions-client.ts"],
    resumeWrapperPresent: "yes",
    notes: "renewRiskExceptionWith401Resume / revokeRiskExceptionWith401Resume (LW-062).",
  },
] as const;

export const LOST_WRITE_401_RESUME_YES_KIND_IDS = [
  "finding_disposition",
  "governance_mutation_correction",
  "architecture_draft_patch",
  "finding_bulk_disposition",
  "governance_workflow_transition",
  "architecture_review_finalize",
  "policy_pack_save",
  "itsm_connector_save",
  "architecture_share_grant",
  "risk_exception_write",
] as const;
