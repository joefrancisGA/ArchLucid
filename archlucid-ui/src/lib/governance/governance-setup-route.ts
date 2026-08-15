/** Canonical Governance setup path (TB-1134 / TB-1135). */
export const GOVERNANCE_SETUP_HREF = "/governance/setup" as const;

/** OperatorPageHeader subtitle on Governance setup — keep aligned with {@link GovernanceSetupGuidePageView}. */
/**
 * Shared so the visible page title and the help-trigger collision guard read the same string. The
 * contextual help topic for this route is also labelled "Governance setup", which is why the trigger
 * renders as "Help" instead of repeating the title.
 */
export const GOVERNANCE_SETUP_PAGE_TITLE = "Governance setup" as const;

export const GOVERNANCE_SETUP_PAGE_SUBTITLE =
  "Set policy, alerts, approvals, and sponsor reporting so governance can run day to day." as const;

/** Always-visible outcomes rail — operating-loop framing without duplicating per-step outcomes (TB-1138). */
export const GOVERNANCE_SETUP_OUTCOMES_HEADING = "What this guide unlocks" as const;

export const GOVERNANCE_SETUP_OUTCOMES_INTRO =
  "Complete the steps to stand up an operating governance loop — not a one-time checklist." as const;

/** Legacy program nickname path — permanent redirect target is {@link GOVERNANCE_SETUP_HREF}. */
export const GOVERNANCE_SETUP_LEGACY_FIRST_30_DAYS_HREF = "/governance/first-30-days" as const;
