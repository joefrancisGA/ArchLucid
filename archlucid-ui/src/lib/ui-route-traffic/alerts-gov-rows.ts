import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance-route-paths";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import type { UiRouteTrafficRow } from "@/lib/ui-route-traffic/types";

/** Traffic workbook rows for the `alerts-gov` workbook section. */
export const ALERTS_GOV_TRAFFIC_ROWS: readonly UiRouteTrafficRow[] = [
  /** Traffic workbook row ID for Alert inbox. Owner backlog shorthand: AL. */
  {
    rowId: "AL",
    path: "/governance/alerts",
    section: "Alerts/gov",
    note: "Alert inbox (Alerts/gov) - AlertsHubChrome with PageContextualHelpButton (topic map alerts; Category-1 registry), streaming inbox body. Sibling SAX = alert rules; HA = alerts help; ALE = routing tab. Not a signed-record Sources trail by itself. Score 72/100 (2026-08-08) - alert triage launcher at ARE/GFN Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Governance audit trail. Owner backlog shorthand: AUD. */
  {
    rowId: "AUD",
    path: "/governance/audit",
    section: "Alerts/gov",
    note: "Governance audit trail (Alerts/gov) - AuditPageView with AuditPageHeader PageContextualHelpButton (topic map audit-trail; Category-1 registry), search/filters, integrity export/verify when available. Not a signed-record Sources trail by itself. Score 68/100 (2026-08-08) - activity-log launcher at GFN governance Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["AuditPageView", "Score 68", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for approval lineage. Owner backlog shorthand: GAI. */
  {
    rowId: "GAI",
    path: "/governance/approval-requests/[id]/lineage",
    section: "Alerts/gov",
    note: "Approval lineage (Alerts/gov) - GovernanceApprovalLineageDetailContent with PageContextualHelpButton (topic map governance-approval; Category-1 registry on /governance/approval-requests), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), approval status/risk, review + signed-record version links, findings/completeness. Governance linkage view - not a full diligence Sources package alone. Score 68/100 (2026-08-08) - lineage linkage at GFN Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["GovernanceApprovalLineageDetailContent", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Decision register. Owner backlog shorthand: GDO. */
  {
    rowId: "GDO",
    path: "/governance/decision-register",
    section: "Alerts/gov",
    note: "Decision register (Alerts/gov) - DecisionRegisterClient with OperatorPageHeader PageContextualHelpButton (Learn more omitted - no decision-register specialty; TB-2050; not governance-approval catch-all), Category-1 registry, filters/summary/cards/timeline. Not a signed-record Sources trail by itself. Score 68/100 (2026-08-08) - register browse at GFN Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["DecisionRegisterClient", "Score 68", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Governance findings queue. Owner backlog shorthand: GFN. */
  {
    rowId: "GFN",
    path: GOVERNANCE_FINDINGS_PATH,
    section: "Alerts/gov",
    note: "Findings queue (Alerts/gov) - GovernanceFindingsQueueClient with PageContextualHelpButton (topic map governance-approval; Category-1 registry), filters/list. Sibling RRF = finding detail; ERU = evidence-trace; AL = alerts. Not a signed-record Sources trail by itself. Score 72/100 (2026-08-08) - risk-register queue hard-caps higher Evidence without full diligence packing. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Governance setup guide. Owner backlog shorthand: GFX. */
  {
    rowId: "GFX",
    path: "/governance/setup",
    section: "Alerts/gov",
    note: "Governance setup guide (Alerts/gov) - GovernanceSetupGuidePageView with PageContextualHelpButton (topic map governance-approval; Category-1 registry), outcome-framed steps and progress coach. Links into audited config workspaces. Not a signed-record Sources trail. Score 62/100 (2026-08-08) - setup checklist hard-caps without live config depth. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
  },
  /** Traffic workbook row ID for governance approval queue. Owner backlog shorthand: GOP. */
  {
    rowId: "GOP",
    path: GOVERNANCE_APPROVAL_QUEUE_PATH,
    section: "Alerts/gov",
    note: "Approval queue (Alerts/gov) - GovernanceWorkflowPageContent with PageContextualHelpButton (topic map governance-approval; Category-1 registry on /governance/approval-queue), submit/approve/reject workflow + overview panel. Record-decision deep link (?runId=#governance-approval-requests) keeps Approval queue page title aligned with nav, preselects the review picker (orphan SelectItem + preferAutoPick off in review context), resolves a human review title (not a raw GUID), auto-fills signed review record version from getRunDetail, syncs URL on load/back, scrolls to decision or submit by phase, and disables submit until review/version/source/target are ready with inline readiness. Sibling GAI = approval lineage; GO = governance-approval help; GDX = workspace health; AUD = audit. Decision workflow - not a signed-record Sources trail alone. Score 58/100 (2026-08-08) - deep-link decision focus + submit readiness; approval-queue hub still hard-caps higher Evidence without audit export depth. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "Record-decision deep link", "auto-fills signed review record version", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Policy pack detail. Owner backlog shorthand: GPI. */
  {
    rowId: "GPI",
    path: "/governance/policy-packs/[id]",
    section: "Alerts/gov",
    note: "Policy pack detail (Alerts/gov) - PolicyPackDetailClient with PolicyPackDetailEvidenceChrome (PageContextualHelpButton; topic map policy-packs / Policy packs; Category-1 registry), specialty/generic pack narratives. Sibling GPP = packs hub. Not a signed-record Sources trail. Score 68/100 (2026-08-08) - pack detail at GFN Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["PolicyPackDetailClient", "Score 68", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Policy packs hub. Owner backlog shorthand: GPP. */
  {
    rowId: "GPP",
    path: "/governance/policy-packs",
    section: "Alerts/gov",
    note: "Policy packs hub (Alerts/gov) - PolicyPacksPageClient with PolicyPacksPageHeader PageContextualHelpButton (topic map policy-packs; Category-1 registry), catalog/my-packs tabs and authoring. Sibling GPI = pack detail; GRS = standards-and-rules. Not a signed-record Sources trail. Score 68/100 (2026-08-08) - governance library hub at GFN Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Score 68", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Risk exceptions. Owner backlog shorthand: GRO. */
  {
    rowId: "GRO",
    path: "/governance/exceptions",
    section: "Alerts/gov",
    note: "Risk exceptions (Alerts/gov) - RiskExceptionsClient with PageContextualHelpButton (topic map findings; Category-1 registry), renew/revoke table. Sibling GFN = findings; GDO = decision register. Not a signed-record Sources trail by itself. Score 68/100 (2026-08-08) - waiver register at GFN Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Standards & rules. Owner backlog shorthand: GRS. */
  {
    rowId: "GRS",
    path: "/governance/standards-and-rules",
    section: "Alerts/gov",
    note: "Standards & rules (Alerts/gov) - GovernanceResolutionPageClient with PageContextualHelpButton (topic map policy-packs; Category-1 registry), applied-rule table and resolution diagnostics. Sibling GPP = policy-packs hub; GPI = pack detail. Not a signed-record Sources trail. Score 68/100 (2026-08-08) - governance resolution hub at GFN Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Score 68", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Recurrence schedules. Owner backlog shorthand: GRX. */
  {
    rowId: "GRX",
    path: "/governance/recurrence-schedules",
    section: "Alerts/gov",
    note: "Recurrence schedules (Alerts/gov) - RecurrenceSchedulesClient with PageContextualHelpButton (topic map governance-approval; Category-1 registry), create/activate table. Sibling GFN = findings; ADV = advisory scans. Not a signed-record Sources trail. Score 68/100 (2026-08-08) - schedule config at GFN Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for signed review record detail. Owner backlog shorthand: MMX. */
  {
    rowId: "MMX",
    path: `${SIGNED_RECORDS_LIST_PATH}/[manifestId]` as const,
    section: "Alerts/gov",
    note: "Signed review record detail (Alerts/gov) - ManifestDetailPageView with PageContextualHelpButton (topic map review-packages; Category-1 registry on /governance/signed-records), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), summary/decisions/artifacts/bundle downloads, OperatorEvidenceLimitsFooter. Formerly `/signed-records/[manifestId]` (retired bookmark). Application-layer package lineage - not Trust Center attestation. Score 72/100 (2026-08-08) - package detail at RRE/GFN Evidence band; hard-caps higher Evidence without Trust Center diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["ManifestDetailPageView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Alert rules hub (default Conditions tab). Owner backlog shorthand: SAX. */
  {
    rowId: "SAX",
    path: "/governance/alert-rules",
    section: "Alerts/gov",
    note: "Alert rules hub (Alerts/gov) - AlertRulesHubClient with PageContextualHelpButton (topic map alerts; Category-1 registry), Learn more / claim-discipline orientation strip on non-routing tabs (Sources follow-up removed TB-2092; Notifications/routing keeps ALE sibling chrome), Conditions/Notifications/Advanced/Test tabs. Alert configuration - not a signed-record Sources trail. Sibling ALE = routing tab. Score 68/100 (2026-08-08) - alert-config hub at AL Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["AlertRulesHubClient", "Sources", "cannot improve further toward 80"],
  },
];
