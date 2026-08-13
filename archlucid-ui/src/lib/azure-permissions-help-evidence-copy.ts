import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const AZURE_PERMISSIONS_HELP_CANONICAL_PATH = "/help/azure-permissions" as const;

export const AZURE_PERMISSIONS_HELP_TOPIC_LABEL = "How Azure permissions work" as const;

export type AzurePermissionsHelpJobMatrixRow = {
  readonly label: string;
  readonly when: string;
  readonly href?: string;
  readonly isCurrent?: boolean;
};

/** TB-1629 — explicit job split vs Connect Azure securely. */
export const AZURE_PERMISSIONS_HELP_JOB_MATRIX_HEADING = "Which Azure help guide?";

export const AZURE_PERMISSIONS_HELP_JOB_MATRIX_TEST_ID = "help-azure-permissions-job-matrix";

export const AZURE_PERMISSIONS_HELP_JOB_MATRIX: readonly AzurePermissionsHelpJobMatrixRow[] = [
  {
    label: "Connect Azure securely",
    href: inAppHelpHref("cloud-connections-azure"),
    when: "Federated trust setup, connection validation, and security model — start from the Azure connection page",
  },
  {
    label: "This Azure permissions guide",
    when: "Role assignments, scope limits, collected data, and permission troubleshooting",
    isCurrent: true,
  },
] as const;

/** TB-1626 — first-viewport configure/verify entry point for `/help/azure-permissions`. */
export const AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION = {
  label: "Open Azure connection setup",
  testId: "azure-permissions-setup-primary-action",
  defaultHref: "/integrations/cloud-connections/azure",
} as const;

export const AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE =
  "This Azure permissions guide explains read-only roles for cloud connections — it is connector setup orientation, not a signed-review diligence Sources package. Open Assurance status or the live Cloud connections hub before treating permission tables as assurance evidence.";

/** TB-1627 — first-viewport setup story before deferred IAM tables. */
export const AZURE_PERMISSIONS_HELP_FIRST_VIEWPORT_TEST_ID = "help-azure-permissions-first-viewport";

export const AZURE_PERMISSIONS_HELP_DEFERRED_MATRIX_DISCLOSURE_TEST_ID =
  "azure-permissions-matrix-disclosure";

export const AZURE_PERMISSIONS_HELP_DEFERRED_CUSTOM_ROLE_DISCLOSURE_TEST_ID =
  "azure-permissions-custom-role-disclosure";

/** TB-1628 — buyer-safe primary chrome; no eng tier or release-contract theater. */
export const AZURE_PERMISSIONS_HELP_BANNED_PRIMARY_CHROME_COPY = [
  "Tier 1",
  "Tier 2",
  "release contract",
  "Evidence tier",
] as const;

export const AZURE_PERMISSIONS_HELP_HEADER_TEST_ID = "help-azure-permissions-header";

export const AZURE_PERMISSIONS_HELP_REQUIREMENTS_REVIEWED_DISCLOSURE_TEST_ID =
  "azure-permissions-requirements-reviewed-disclosure";

export const AZURE_PERMISSIONS_HELP_REQUIREMENTS_REVIEWED_DISCLOSURE_TITLE =
  "When these requirements were last reviewed";

export const AZURE_PERMISSIONS_HELP_REQUIREMENTS_REVIEWED_DISCLOSURE_SUMMARY =
  "Applies to hosted Azure cloud connections in this workspace.";

export function formatAzurePermissionsHelpRequirementsReviewedLine(contractVersion: string): string {
  return `Permission requirements last reviewed on ${contractVersion}.`;
}
