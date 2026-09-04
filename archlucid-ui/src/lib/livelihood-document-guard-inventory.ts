import type { ErrorRecoveryContractGuardedSurface } from "@/lib/error-recovery-contract-inventory";

const LIVELIHOOD_DOCUMENT_GUARD_MARKER = "useLivelihoodDocumentGuards";

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
    id: "integrations/azure-boards-connection",
    sourceRoots: ["app/(operator)/integrations/azure-boards/_sections/AzureBoardsIntegrationPageClient.tsx"],
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
 * Dirty operator forms deferred to LD-12 — documented so the inventory does not silently grow.
 */
export const LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES: readonly string[] = [] as const;
