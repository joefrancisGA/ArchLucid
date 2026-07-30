/** Canonical Governance setup path (TB-1134 / TB-1135). */
export const GOVERNANCE_SETUP_HREF = "/governance/setup" as const;

/** OperatorPageHeader subtitle on Governance setup — keep aligned with {@link GovernanceSetupGuidePageView}. */
export const GOVERNANCE_SETUP_PAGE_SUBTITLE =
  "Establish the core policies, alerts, approvals, and reporting your workspace needs." as const;

/** Legacy program nickname path — permanent redirect target is {@link GOVERNANCE_SETUP_HREF}. */
export const GOVERNANCE_SETUP_LEGACY_FIRST_30_DAYS_HREF = "/governance/first-30-days" as const;
