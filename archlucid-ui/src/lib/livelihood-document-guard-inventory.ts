import type { ErrorRecoveryContractGuardedSurface } from "@/lib/error-recovery-contract-inventory";

const LIVELIHOOD_DOCUMENT_GUARD_MARKER = "useLivelihoodDocumentGuards";

export type LivelihoodDocumentGuardDeferredSurface = {
  readonly id: string;
  readonly sourceRoots: readonly string[];
  readonly reason: string;
};

/**
 * Operator document surfaces that compute dirty state must wire {@link useLivelihoodDocumentGuards}
 * (RS-07). URL-only filters and post-save idle states are out of scope.
 */
export const LIVELIHOOD_DOCUMENT_GUARD_SURFACES: readonly ErrorRecoveryContractGuardedSurface[] = [
  {
    id: "policy-pack-authoring",
    sourceRoots: ["app/(operator)/governance/policy-packs/_sections/PolicyPacksPageClient.tsx"],
    requiredMarkers: [LIVELIHOOD_DOCUMENT_GUARD_MARKER],
  },
  {
    id: "sso-wizard",
    sourceRoots: ["app/(operator)/administration/identity/sso-wizard/_sections/SsoWizardPageClient.tsx"],
    requiredMarkers: [LIVELIHOOD_DOCUMENT_GUARD_MARKER],
  },
  {
    id: "identity-providers-saml",
    sourceRoots: [
      "app/(operator)/administration/identity-providers/_sections/IdentityProvidersSamlPageClient.tsx",
    ],
    requiredMarkers: [LIVELIHOOD_DOCUMENT_GUARD_MARKER],
  },
  {
    id: "settings-roles-matrix",
    sourceRoots: ["app/(operator)/administration/users/_sections/SettingsRolesMatrixSection.tsx"],
    requiredMarkers: [LIVELIHOOD_DOCUMENT_GUARD_MARKER],
  },
  {
    id: "exec-digest-schedule",
    sourceRoots: ["components/digests/ExecDigestScheduleContent.tsx"],
    requiredMarkers: [LIVELIHOOD_DOCUMENT_GUARD_MARKER],
  },
  {
    id: "tenant-work-ownership-delete-policy",
    sourceRoots: [
      "app/(operator)/administration/workspace-settings/_sections/TenantWorkOwnershipDeletePolicyCard.tsx",
    ],
    requiredMarkers: [LIVELIHOOD_DOCUMENT_GUARD_MARKER],
  },
  {
    id: "tenant-cost-settings",
    sourceRoots: [
      "app/(operator)/administration/workspace-settings/_sections/use-tenant-cost-settings-form.ts",
    ],
    requiredMarkers: [LIVELIHOOD_DOCUMENT_GUARD_MARKER],
  },
  {
    id: "alert-rules-create",
    sourceRoots: ["components/alerts/use-alert-rules-content-create.ts"],
    requiredMarkers: [LIVELIHOOD_DOCUMENT_GUARD_MARKER],
  },
  {
    id: "finding-inspect-disposition",
    sourceRoots: [
      "app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectDispositionControls.tsx",
    ],
    requiredMarkers: [LIVELIHOOD_DOCUMENT_GUARD_MARKER],
  },
  {
    id: "finding-mute-reason",
    sourceRoots: ["components/findings/QuickDecisionFindingMuteDialog.tsx"],
    requiredMarkers: [LIVELIHOOD_DOCUMENT_GUARD_MARKER],
  },
  {
    id: "integrations/azure-boards-connection",
    sourceRoots: ["app/(operator)/integrations/azure-boards/_sections/AzureBoardsIntegrationPageClient.tsx"],
    requiredMarkers: [LIVELIHOOD_DOCUMENT_GUARD_MARKER],
  },
  {
    id: "integrations/servicenow-settings",
    sourceRoots: ["app/(operator)/integrations/servicenow/_sections/ServiceNowIntegrationPageClient.tsx"],
    requiredMarkers: [LIVELIHOOD_DOCUMENT_GUARD_MARKER],
  },
  {
    id: "integrations/jira-workspace-routing",
    sourceRoots: ["app/(operator)/integrations/jira/_sections/JiraIntegrationPageClient.tsx"],
    requiredMarkers: [LIVELIHOOD_DOCUMENT_GUARD_MARKER],
  },
  {
    id: "integrations/teams-connection",
    sourceRoots: ["app/(operator)/integrations/teams/_sections/TeamsNotificationsIntegrationPageClient.tsx"],
    requiredMarkers: [LIVELIHOOD_DOCUMENT_GUARD_MARKER],
  },
  {
    id: "governance/risk-exception-renew",
    sourceRoots: ["components/governance/use-risk-exceptions-client.ts"],
    requiredMarkers: [LIVELIHOOD_DOCUMENT_GUARD_MARKER],
  },
] as const;

/**
 * Surfaces that intentionally compose the lower-level guard primitives directly (architecture
 * draft editor lock + custom dialog). Do not add new entries without product review.
 */
export const LIVELIHOOD_DOCUMENT_GUARD_PRIMITIVE_SURFACES: readonly ErrorRecoveryContractGuardedSurface[] = [
  {
    id: "architecture-draft-workspace",
    sourceRoots: ["components/architecture/ArchitectureDraftWorkspace.tsx"],
    requiredMarkers: ["useUnsavedChangesGuard", "useInAppNavigationGuard"],
  },
] as const;

/**
 * Explicit dirty-form paths in architecture / review / governance / insights scope. CI ensures each
 * row is guarded or deferred — see {@link findLivelihoodDocumentGuardInventoryViolations}.
 */
export const LIVELIHOOD_DOCUMENT_GUARD_MONITORED_ARCHITECTURE_REVIEW_DIRTY_FORM_PATHS: readonly string[] = [
  "app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectDispositionControls.tsx",
  "components/findings/QuickDecisionFindingMuteDialog.tsx",
  "components/governance/use-risk-exceptions-client.ts",
  "app/(operator)/integrations/jira/_sections/JiraIntegrationPageClient.tsx",
  "app/(operator)/integrations/servicenow/_sections/ServiceNowIntegrationPageClient.tsx",
  "app/(operator)/integrations/teams/_sections/TeamsNotificationsIntegrationPageClient.tsx",
] as const;

/**
 * Dirty operator forms deferred beyond LP-11 — documented so the inventory does not silently grow.
 * Shrink-only baseline: {@link LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_COUNT_BASELINE}.
 */
export const LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES: readonly LivelihoodDocumentGuardDeferredSurface[] = [
  {
    id: "compare-two-reviews-run-pickers",
    sourceRoots: ["app/(operator)/insights/compare-two-reviews/_sections/use-compare-form-run-selection.ts"],
    reason: "Run pair selection syncs to URL immediately; no free-text document dirty state.",
  },
  {
    id: "architecture-identity-rename",
    sourceRoots: ["components/architecture/ArchitectureIdentityRenameForm.tsx"],
    reason: "Single-field rename defers to LP-12 session keepalive sweep; autosave not yet wired.",
  },
  {
    id: "governance-remediation-patterns-yaml",
    sourceRoots: ["app/(operator)/governance/remediation-patterns/RemediationPatternsClient.tsx"],
    reason: "YAML import draft is admin-only and ships with explicit import confirmation — LP-12 follow-up.",
  },
  {
    id: "architecture-intake-wizards",
    sourceRoots: ["app/(operator)/architecture/reviews/new/SocraticIntakeWizard.tsx"],
    reason: "Wizard session persistence exists; navigation guard batch lands with LP-12 keepalive sweep.",
  },
  {
    id: "pilot-scorecard-assumptions",
    sourceRoots: ["app/(operator)/insights/architecture-scorecard/_sections/use-pilot-scorecard-page.ts"],
    reason: "Scorecard assumption overrides are exploratory analytics — defer until sponsor desk LP-14 preview gate.",
  },
] as const;

/** LP-11 baseline — deferred rows may shrink or stay flat; growth requires a documented exception id. */
export const LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_COUNT_BASELINE = 5;

/** Deferred surface ids allowed above the baseline count (must match a row in {@link LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES}). */
export const LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_DOCUMENTED_EXCEPTIONS: readonly string[] = [] as const;
