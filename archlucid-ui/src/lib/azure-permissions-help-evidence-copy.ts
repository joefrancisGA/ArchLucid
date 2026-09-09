import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { hubSecondaryFollowUpsIntro } from "@/lib/evidence-orientation/hub-secondary-follow-ups";

export const AZURE_PERMISSIONS_HELP_CANONICAL_PATH = "/help/azure-permissions" as const;

export const AZURE_PERMISSIONS_HELP_TOPIC_LABEL = "How Azure permissions work" as const;

export const AZURE_PERMISSIONS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const AZURE_PERMISSIONS_HELP_SOURCES_INTRO =
  "Use these follow-ups when Azure permission questions need live connection settings, health checks, or assurance citations.";

/** Help Sources — excludes action-panel destinations already in the first viewport. */
export const AZURE_PERMISSIONS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Connect Azure securely", href: inAppHelpHref("cloud-connections-azure") },
  { label: "Cloud connections hub", href: "/integrations/cloud-connections" },
  { label: "Azure connection settings", href: "/integrations/cloud-connections/azure" },
  { label: "Connection status", href: "/administration/connection-status" },
  { label: "Assurance status", href: "/assurance-status" },
] as const;

/** TB-1626 — first-viewport configure/verify entry point for `/help/azure-permissions`. */
export const AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION = {
  label: "Open Azure connection setup",
  testId: "azure-permissions-setup-primary-action",
  defaultHref: "/integrations/cloud-connections/azure",
} as const;

const AZURE_PERMISSIONS_HELP_EXCLUDED_ORIENTATION_HREFS = new Set<string>([
  AZURE_PERMISSIONS_HELP_CANONICAL_PATH,
  AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION.defaultHref,
]);

export const AZURE_PERMISSIONS_HELP_ORIENTATION_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "Azure permission questions need live connection settings, health checks, or assurance citations",
);

/** Help orientation Sources — excludes self-href and primary setup action (HE). */
export const AZURE_PERMISSIONS_HELP_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] =
  AZURE_PERMISSIONS_HELP_SOURCES.filter(
    (source) => !AZURE_PERMISSIONS_HELP_EXCLUDED_ORIENTATION_HREFS.has(source.href),
  );

export const AZURE_PERMISSIONS_HELP_PAGE_LEAD =
  "Assign the minimum read-only Azure roles ArchLucid needs to collect architecture evidence from your subscription. Cost Management Reader is optional unless cost analysis is enabled for the connection.";

export const AZURE_PERMISSIONS_HELP_START_HERE_HELPER =
  "Use Open Azure connection setup below to assign roles and verify the connection, then expand the permission matrix when procurement needs full IAM detail.";

export const AZURE_PERMISSIONS_HELP_ORIENTATION_BOTTOM_TEST_ID =
  "help-azure-permissions-orientation-bottom" as const;

export type AzurePermissionsHelpJobMatrixRow = {
  readonly label: string;
  readonly when: string;
  readonly href?: string;
  readonly isCurrent?: boolean;
};

/** TB-1629 — explicit job split vs Connect Azure securely. */
export const AZURE_PERMISSIONS_HELP_JOB_MATRIX_HEADING = "Which Azure help guide?";

export const AZURE_PERMISSIONS_HELP_JOB_MATRIX_TEST_ID = "help-azure-permissions-job-matrix";

/** TB-1630 — Suspense fallback while connection query params hydrate. */
export const AZURE_PERMISSIONS_HELP_CONNECTION_CONTEXT_LOADING_SKELETON_TEST_ID =
  "azure-permissions-connection-context-loading-skeleton";

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

export const AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE =
  "This Azure permissions guide explains read-only roles for cloud connections — connector setup orientation, not a full audit export. Open Assurance status or Cloud connections before using permission tables in procurement.";

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
