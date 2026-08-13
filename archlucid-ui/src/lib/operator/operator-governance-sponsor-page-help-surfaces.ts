/**
 * TB-1668 — Governance + sponsor-report hubs that must mount `PageContextualHelpButton` with topic map rows.
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § *Operator page contextual help* (**TB-1666**).
 */

export type OperatorGovernanceSponsorPageHelpSurfaceEntry = {
  readonly id: string;
  readonly pathname: string;
  readonly modulePath: string;
  readonly notes: string;
};

/** Surfaces named in **TB-1668** (GDX/alerts topic slice shipped 2026-08-03; remainder closed 2026-08-12). */
export const OPERATOR_GOVERNANCE_SPONSOR_PAGE_HELP_TB1668_SURFACES: readonly OperatorGovernanceSponsorPageHelpSurfaceEntry[] =
  [
    {
      id: "governance-workflow",
      pathname: "/governance/approval-queue",
      modulePath: "app/(operator)/governance/_sections/GovernanceWorkflowPageContent.tsx",
      notes: "Governance approval queue — governance-approval help topic.",
    },
    {
      id: "governance-setup",
      pathname: "/governance/setup",
      modulePath: "app/(operator)/governance/setup/_sections/GovernanceSetupGuidePageView.tsx",
      notes: "Governance setup guide — governance-approval help topic.",
    },
    {
      id: "governance-exceptions",
      pathname: "/governance/exceptions",
      modulePath: "components/governance/RiskExceptionsClient.tsx",
      notes: "Risk exceptions register — governance-approval help topic.",
    },
    {
      id: "governance-policy-packs",
      pathname: "/governance/policy-packs",
      modulePath: "app/(operator)/governance/policy-packs/_sections/PolicyPacksPageHeader.tsx",
      notes: "Policy packs hub — policy-packs help topic.",
    },
    {
      id: "governance-standards-rules",
      pathname: "/governance/standards-and-rules",
      modulePath: "app/(operator)/governance/standards-and-rules/_sections/GovernanceResolutionPageView.tsx",
      notes: "Standards and rules — standards-and-rules specialty help topic.",
    },
    {
      id: "governance-decision-register",
      pathname: "/governance/decision-register",
      modulePath: "app/(operator)/governance/decision-register/DecisionRegisterClient.tsx",
      notes: "Decision register — label-only secondary hub (no Learn more).",
    },
    {
      id: "governance-audit",
      pathname: "/governance/audit",
      modulePath: "app/(operator)/governance/audit/_sections/AuditPageHeader.tsx",
      notes: "Audit trail search — audit-trail help topic.",
    },
    {
      id: "governance-recurrence-schedules",
      pathname: "/governance/recurrence-schedules",
      modulePath: "components/governance/RecurrenceSchedulesClient.tsx",
      notes: "Recurrence schedules — recurrence-schedules help topic.",
    },
    {
      id: "governance-findings",
      pathname: "/governance/findings",
      modulePath: "app/(operator)/governance/findings/GovernanceFindingsQueueClient.tsx",
      notes: "Findings queue — governance-approval help topic.",
    },
    {
      id: "governance-alerts",
      pathname: "/governance/alerts",
      modulePath: "app/(operator)/governance/alerts/AlertsHubChrome.tsx",
      notes: "Alerts inbox — alerts help topic (not governance-approval).",
    },
    {
      id: "governance-alert-rules",
      pathname: "/governance/alert-rules",
      modulePath: "app/(operator)/governance/alert-rules/AlertRulesPageHeader.tsx",
      notes: "Alert rules hub — alerts help topic.",
    },
    {
      id: "governance-advisory-scans",
      pathname: "/governance/advisory-scans",
      modulePath: "components/advisory/AdvisoryHubClient.tsx",
      notes: "Advisory scans hub — label-only secondary hub.",
    },
    {
      id: "sponsor-executive-summary",
      pathname: "/insights/executive-summary",
      modulePath: "app/(operator)/insights/executive-summary/_sections/PilotValueReportPageView.tsx",
      notes: "Sponsor report — executive-summary help topic with How the sponsor report works trigger.",
    },
    {
      id: "sponsor-roi-summary",
      pathname: "/insights/roi-summary",
      modulePath: "app/(operator)/insights/roi-summary/_sections/RoiSummaryPageView.tsx",
      notes: "ROI summary — roi-summary help topic.",
    },
  ];
