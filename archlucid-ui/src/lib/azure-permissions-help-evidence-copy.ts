export const AZURE_PERMISSIONS_HELP_CANONICAL_PATH = "/help/azure-permissions" as const;

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
