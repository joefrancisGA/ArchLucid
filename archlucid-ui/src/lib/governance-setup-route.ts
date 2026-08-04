/** Canonical Governance setup path (TB-1134 / TB-1135). */
export const GOVERNANCE_SETUP_HREF = "/governance/setup" as const;

/** OperatorPageHeader subtitle on Governance setup — keep aligned with {@link GovernanceSetupGuidePageView}. */
export const GOVERNANCE_SETUP_PAGE_SUBTITLE =
  "Set policy, alerts, approvals, and sponsor reporting so governance can run day to day." as const;

/** Always-visible outcomes rail — value framing, not Pending status theater (TB-1138). */
export const GOVERNANCE_SETUP_OUTCOMES_HEADING = "What this guide unlocks" as const;

export const GOVERNANCE_SETUP_OUTCOMES_INTRO =
  "Complete the steps to stand up an operating governance loop — not a one-time checklist." as const;

export const GOVERNANCE_SETUP_OUTCOME_BULLETS = [
  "Consistent policy baseline on every architecture review",
  "Alert routing to the teams who must respond",
  "Clear approval expectations and ownership",
  "Sponsor-ready posture and value reporting",
] as const;

/** Legacy program nickname path — permanent redirect target is {@link GOVERNANCE_SETUP_HREF}. */
export const GOVERNANCE_SETUP_LEGACY_FIRST_30_DAYS_HREF = "/governance/first-30-days" as const;
