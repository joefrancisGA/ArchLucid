/** Execute lifecycle step — advisory emission, not live Azure mutation. */
export const REMEDIATION_WORKBENCH_EXECUTE_ADVISORY_HONESTY_LINE =
  "Execute (emit advisory) records an operator intent and advisory payload in this tenant. It does not deploy or change resources in Azure." as const;