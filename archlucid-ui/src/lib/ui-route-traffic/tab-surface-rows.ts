import { ADVISORY_SCANS_SCANS_HREF, ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { DIGESTS_BROWSE_TAB_PATH, DIGESTS_SUBSCRIPTIONS_TAB_PATH } from "@/lib/digests-route-paths";
import { governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import { SETTINGS_USERS_ROLES_TAB_PATH, SETTINGS_USERS_USERS_TAB_PATH } from "@/lib/settings-admin-route-paths";
import type { UiRouteTrafficRow } from "@/lib/ui-route-traffic/types";

/** Traffic workbook rows for the `tab-surface` workbook section. */
export const TAB_SURFACE_TRAFFIC_ROWS: readonly UiRouteTrafficRow[] = [
  /** Traffic workbook row ID for Advisory scans Schedules tab. Owner backlog shorthand: AD. */
  {
    rowId: "AD",
    path: ADVISORY_SCANS_SCHEDULES_HREF,
    section: "Tab surface",
    note: "Advisory scans Schedules tab (Tab surface) - inherits ADV hub Evidence chrome (PageContextualHelpButton + Category-1 registry on /governance/advisory-scans; Sources follow-up chrome removed (TB-2092) Sources + claim-discipline above tabs). AdvisorySchedulesContent + AdvisoryScheduleCreateForm; digest send-test and setup-gap handoffs. Legacy /advisory-scheduling redirects via TB-1124. Sibling ADV = hub/scans.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["AdvisorySchedulesContent", "Sources", "TB-1124", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
    sectionMustNotEqualLower: ["marketing"],
  },
  /** Traffic workbook row ID for Advisory scans Scans tab. Owner backlog shorthand: ADT (owner GOA renamed to avoid collision with template alert-rules GOA). */
  {
    rowId: "ADT",
    path: ADVISORY_SCANS_SCANS_HREF,
    section: "Tab surface",
    note: "Advisory scans Scans tab (Tab surface) - inherits ADV hub Evidence chrome (PageContextualHelpButton + Category-1 registry on /governance/advisory-scans; Sources follow-up chrome removed (TB-2092) Sources + claim-discipline above tabs). Default Scans tab content (recommendation generate). Sibling ADV = hub; AD = Schedules tab. Follow-up recommendations - not a signed-record Sources trail.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner GOA renamed to ADT to avoid collision with template alert-rules GOA. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Digests Subscriptions tab. Owner backlog shorthand: AIS (template formerly DIX / ARS-as-subscriptions). */
  {
    rowId: "AIS",
    path: DIGESTS_SUBSCRIPTIONS_TAB_PATH,
    section: "Tab surface",
    note: "Digests Subscriptions tab (Tab surface) - inherits ARD hub Evidence chrome (DigestsHubClient DigestsPageHeader PageContextualHelp + Category-1 registry on /architecture/digests; Sources follow-up strip below tabs, no claim-boundary band). DigestsHubClient syncs ?tab=subscriptions; mounts DigestSubscriptionsContent (DigestSubscriptionsReadinessPanel + subscription list). Sibling ARB = browse; ARS = schedule; ARD = hub; HDI = Digests help.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["DigestSubscriptionsReadinessPanel", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Digests Browse tab. Owner backlog shorthand: ARB (template formerly DIB / ARD-as-browse). */
  {
    rowId: "ARB",
    path: DIGESTS_BROWSE_TAB_PATH,
    section: "Tab surface",
    note: "Digests Browse tab (Tab surface) - inherits ARD hub Evidence chrome (DigestsHubClient DigestsPageHeader PageContextualHelp + Category-1 registry on /architecture/digests; Sources follow-up strip below tabs, no claim-boundary band). DigestsHubClient syncs ?tab=get-started; mounts DigestsBrowseContent (DigestsBrowseSetupChecklist + history). Sibling ARS = schedule; AIS = subscriptions; ARD = hub; HDI = Digests help.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["DigestsBrowseSetupChecklist", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Alert rules Conditions (rules) tab. Owner backlog shorthand: GLR (owner GOR renamed to avoid collision with template routing GOR / ALE). */
  {
    rowId: "GLR",
    path: "/governance/alert-rules?tab=rules",
    section: "Tab surface",
    note: "Alert rules Conditions/rules tab (Tab surface) - inherits SAX hub Evidence chrome (PageContextualHelpButton + Category-1 registry on /governance/alert-rules; Sources follow-up chrome removed (TB-2092) Sources + claim-discipline when not on Notifications). AlertRulesContentDeferred condition editor. Sibling SAX = hub; ALE/GOR = routing; GOC = composite; GOS = simulation. Alert configuration - not a signed-record Sources trail.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner GOR renamed to GLR to avoid collision with template routing GOR. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Alert rules Advanced (composite) tab. Owner backlog shorthand: GOC. */
  {
    rowId: "GOC",
    path: governanceAlertRulesTabHref("advanced-rules"),
    section: "Tab surface",
    note: "Alert rules Advanced rules tab (Tab surface) - inherits SAX hub Evidence chrome (PageContextualHelpButton + Category-1 registry on /governance/alert-rules; Sources follow-up chrome removed (TB-2092) Sources + claim-discipline when not on Notifications). CompositeAlertRulesContentDeferred combines multiple signals. Sibling SAX = hub; ALE/GOR = notifications; GLR = Conditions/rules; GOS = simulation. Alert configuration - not a signed-record Sources trail. Score 58/100 (2026-08-08) - advanced-rules tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Alert rules Test alerts (simulation) tab. Owner backlog shorthand: GOS. */
  {
    rowId: "GOS",
    path: governanceAlertRulesTabHref("test-alerts"),
    section: "Tab surface",
    note: "Alert rules Test alerts tab (Tab surface) - inherits SAX hub Evidence chrome (PageContextualHelpButton + Category-1 registry on /governance/alert-rules; Sources follow-up chrome removed (TB-2092) Sources + claim-discipline when not on Notifications). AlertSimulationTuningSectionDeferred simulates and tunes alert behavior. Sibling SAX = hub; ALE/GOR = notifications; GLR = Conditions/rules; GOC = advanced-rules. Alert configuration - not a signed-record Sources trail. Score 58/100 (2026-08-08) - test-alerts tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for create-home Activity archTab. Owner backlog shorthand: REA. */
  {
    rowId: "REA",
    path: "/architecture/reviews/[runId]?archTab=activity" as const,
    section: "Tab surface",
    note: "Create-home-only archTab (TB-1831) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed review record; ignored on committed ReviewDetailWorkspace (twin: reviewTab=activity on RRE hub chrome). above progress tracker / technology baseline / outcome cards (TB-1846 sibling band). Sibling REG = governance; RED = diagram; REE = evidence; REF = findings; REO = overview; REC = clarifications. Assessment progress only - not a signed-record Sources trail.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Create-home-only", "reviewTab=activity", "ignored on committed ReviewDetailWorkspace", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for create-home Clarifications archTab. Owner backlog shorthand: REC. */
  {
    rowId: "REC",
    path: "/architecture/reviews/[runId]?archTab=clarifications" as const,
    section: "Tab surface",
    note: "Create-home-only archTab (TB-1836) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed review record; ignored on committed ReviewDetailWorkspace (committed packages use reviewTab only; no reviewTab twin for clarifications). above ArchitectureCreatedClarificationsPanel (missing items + open questions). Sibling REA = activity; REG = governance; RED = diagram; REE = evidence; REF = findings; REO = overview. Clarifications only - not a signed-record Sources trail.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Create-home-only", "ignored on committed ReviewDetailWorkspace", "reviewTab only", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for create-home Diagram archTab. Owner backlog shorthand: RED. */
  {
    rowId: "RED",
    path: "/architecture/reviews/[runId]?archTab=diagram" as const,
    section: "Tab surface",
    note: "Create-home-only archTab (TB-1841) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed review record; ignored on committed ReviewDetailWorkspace (twin: reviewTab=architecture on RRE hub chrome). above ArchitectureDiagramPanel (Mermaid generate/edit; not authoritative). Sibling REA = activity; REC = clarifications; REG = governance; REE = evidence; REF = findings; REO = overview. Illustrative diagram only - not a signed-record Sources trail.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Create-home-only", "ignored on committed ReviewDetailWorkspace", "reviewTab=architecture", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for create-home Evidence archTab. Owner backlog shorthand: REE. */
  {
    rowId: "REE",
    path: "/architecture/reviews/[runId]?archTab=evidence" as const,
    section: "Tab surface",
    note: "Create-home-only archTab (TB-1846) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed review record; ignored on committed ReviewDetailWorkspace (twin: reviewTab=evidence on RRE hub chrome). above RunDetailCaptureEvidenceSection / BulkEvidenceUpload. Sibling REA = activity; REC = clarifications; RED = diagram; REF = findings; REG = governance; REO = overview. Capture upload only - not a signed-record Sources trail.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Create-home-only", "ignored on committed ReviewDetailWorkspace", "reviewTab=evidence", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for create-home Findings archTab. Owner backlog shorthand: REF. */
  {
    rowId: "REF",
    path: "/architecture/reviews/[runId]?archTab=findings" as const,
    section: "Tab surface",
    note: "Create-home-only archTab (TB-1851) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed review record; ignored on committed ReviewDetailWorkspace (twin: reviewTab=findings on RRE hub chrome). above create-home findings panel. Sibling REA = activity; REC = clarifications; RED = diagram; REE = evidence; REG = governance; REO = overview. Assessment findings only - not a signed-record Sources trail.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Create-home-only", "ignored on committed ReviewDetailWorkspace", "reviewTab=findings", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for create-home Governance archTab. Owner backlog shorthand: REG. */
  {
    rowId: "REG",
    path: "/architecture/reviews/[runId]?archTab=governance",
    section: "Tab surface",
    note: "Create-home-only archTab (TB-1856) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed review record; ignored on committed ReviewDetailWorkspace (twin: reviewTab=decisions-remediation). RunDetailGovernanceDecisionSection pre-commit honesty (TB-1857) with readiness dl (blocking findings, open exceptions, approval gate), governance-warning callout when needed, What happens next steps, finalize-readiness primary CTA to Activity finalize anchor, secondary activity text link, inline governance-approval and audit-trail help cites, info claim-discipline callout, governance loading skeleton, compact context-bar when tab active, and sponsor/work-item panels gated on manifestId (TB-1858). Not a live approval/audit surface. Score 60/100 (2026-08-08) - surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Create-home-only", "decisions-remediation", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for create-home Overview archTab. Owner backlog shorthand: REO. */
  {
    rowId: "REO",
    path: "/architecture/reviews/[runId]?archTab=overview" as const,
    section: "Tab surface",
    note: "Create-home-only archTab (TB-1861) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed review record; ignored on committed ReviewDetailWorkspace (twin: reviewTab=overview on RRE hub chrome). above ArchitectureCreatedOverviewPanel (structured brief + missing items). Sibling REA = activity; REC = clarifications; RED = diagram; REE = evidence; REF = findings; REG = governance. Submitted brief only - not a signed-record Sources trail.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Create-home-only", "ignored on committed ReviewDetailWorkspace", "reviewTab=overview", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Users and roles Roles tab. Owner backlog shorthand: SER (template formerly SRX). */
  {
    rowId: "SER",
    path: SETTINGS_USERS_ROLES_TAB_PATH,
    section: "Tab surface",
    note: "Users and roles Roles tab (Tab surface) - inherits AUX hub Evidence chrome (SettingsRolesPageView PageContextualHelpButton + Category-1 registry on /administration/users; Sources follow-up chrome removed (TB-2092) above tabs). SettingsRolesPageView syncs ?tab=roles via router.replace; mounts roles matrix + assignable roles. Sibling SSU = users; AUX = hub. Template SRX renamed to SER to match owner.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["SettingsRolesPageView", "?tab=roles", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Users and roles Users tab. Owner backlog shorthand: SSU. */
  {
    rowId: "SSU",
    path: SETTINGS_USERS_USERS_TAB_PATH,
    section: "Tab surface",
    note: "Users and roles Users tab (Tab surface) - inherits AUX hub Evidence chrome (SettingsRolesPageView PageContextualHelpButton + Category-1 registry on /administration/users; Sources follow-up chrome removed (TB-2092) above tabs). SettingsRolesPageView syncs ?tab=users via router.replace for SSU deep-links; mounts invite + pending invitations. Sibling SER = roles; AUX = hub.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["tab-surface ceiling", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
];
