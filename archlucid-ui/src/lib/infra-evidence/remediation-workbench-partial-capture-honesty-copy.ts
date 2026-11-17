/** Remediation workbench steps do not backfill missing Reader scope. */
export const REMEDIATION_WORKBENCH_PARTIAL_CAPTURE_LINE =
  "Remediation steps record workflow in this tenant. They do not backfill missing inventory from a partial capture." as const;

/** Execute under partial capture — same Azure posture as advisory execute. */
export const REMEDIATION_WORKBENCH_EXECUTE_PARTIAL_CAPTURE_LINE =
  "Execute under a partial snapshot still does not deploy or change resources in Azure and does not repair capture gaps." as const;