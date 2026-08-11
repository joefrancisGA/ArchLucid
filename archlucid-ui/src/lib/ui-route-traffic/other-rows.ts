import { ADVISORY_SCANS_HREF } from "@/lib/advisory-scans-route";
import { CONFIGURATION_REFERENCE_HELP_PATH } from "@/lib/configuration-reference-help-route";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import type { UiRouteTrafficRow } from "@/lib/ui-route-traffic/types";

/** Traffic workbook rows for low-volume workbook sections. */
export const OTHER_TRAFFIC_ROWS: readonly UiRouteTrafficRow[] = [
  /** Traffic workbook row ID for Access denied (/403). Owner backlog shorthand: 4XX. */
  {
    rowId: "4XX",
    path: "/403",
    section: "Auth",
    note: "Access denied (Auth) - OperatorAccessDeniedPageClient with, role-missing messaging, sign-in/support actions. Not an operator PageContextualHelp surface. Sibling ASI = signin; AUB = bootstrap. Score 76/100 (2026-08-08) - authz gate hard-caps short of diligence packing. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
  },
  /** Traffic workbook row ID for Auth callback. Owner backlog shorthand: ACB. */
  {
    rowId: "ACB",
    path: "/auth/callback",
    section: "Auth",
    note: "Auth callback (Auth) - CallbackClient with AuthFlowShell loading/failure panels, PKCE token exchange. Not an operator PageContextualHelp surface. Sibling ASI = signin; AUB = bootstrap. Score 58/100 (2026-08-08) - OAuth callback ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Advisory scans hub (default Scans tab). Owner backlog shorthand: ADV. */
  {
    rowId: "ADV",
    path: ADVISORY_SCANS_HREF,
    section: "Advisory",
    note: "Advisory scans hub (Governance) - AdvisoryHubClient with PageContextualHelpButton (Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), Scans/Schedules tabs, recommendation generate + schedules. Follow-up recommendations - not a signed-record Sources trail. Sibling AD = Schedules tab deep link; ADT = Scans tab deep link. Score 68/100 (2026-08-08) - recommendation-launcher at GFN Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["AdvisoryHubClient", "Sources", "cannot improve further toward 80"],
  },
  {
    rowId: "ARD",
    path: DIGESTS_HUB_PATH,
    section: "Digests",
    note: "Architecture digests - DigestsHubClient with DigestsPageHeader PageContextualHelp (topic map digests / Architecture digests; Category-1 registry + Schedule deep links; trigger text reads Help so the header does not echo its own title), tab bar directly under the header, one primary header action (next unresolved setup step, or Preview latest generated digest once configured), Sources follow-up strip below the tabs with no claim-boundary band (owner decision 2026-08-05), WeeklyDigestHealthBanner reduced to a status strip on every tab (status tag + tab-relevant facts only) so each tab tells the setup story exactly once - Browse via DigestsBrowseSetupChecklist, Subscriptions via DigestSubscriptionsReadinessPanel, Schedule via its own readiness rail. One status vocabulary across tabs (Setup incomplete / Action needed / Ready). Learn more â†’ /help/digests (HDG). Not a signed-record Sources trail. Score 71/100 (2026-08-05) after TB-1480 / TB-1501-TB-1505 / TB-2049 - hub launcher hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["DigestsHubClient", "Score 71", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Sign in. Owner backlog shorthand: ASI. */
  {
    rowId: "ASI",
    path: "/auth/signin",
    section: "Auth",
    note: "Sign in (Auth) - SignInClient/SignInFlowClient with AuthFlowShell email/SSO/code steps. Not an operator PageContextualHelp surface. Sibling ACB = callback; AUB = bootstrap; ASU = session-expired. Score 58/100 (2026-08-08) - auth gate ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for session-expired auth handoff. Owner backlog shorthand: ASU. */
  {
    rowId: "ASU",
    path: "/auth/session-expired",
    section: "Auth",
    note: "Session expired (Auth) - SessionExpiredClient/SessionExpiredView with. Not an operator PageContextualHelp surface (signed-out). Sibling ASI = /auth/signin; LOG = legacy /login.auth-gate ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["SessionExpiredClient", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for post-auth bootstrap. Owner backlog shorthand: AUB. */
  {
    rowId: "AUB",
    path: "/auth/bootstrap",
    section: "Auth",
    note: "Auth bootstrap (Auth) - PostAuthBootstrapClient with. Accept invitation / select workspace / create workspace / no-access steps. Not an operator PageContextualHelp surface (post-sign-in handoff). Sibling ASU = session-expired; ASI = signin; AUI = invite.auth-gate ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for invitation accept handoff. Owner backlog shorthand: AUI. */
  {
    rowId: "AUI",
    path: "/auth/invite",
    section: "Auth",
    note: "Auth invite (Auth) - InvitationAcceptPageClient with. Token validation + Continue to sign in. Not an operator PageContextualHelp surface (pre-sign-in handoff). Sibling AUB = bootstrap; ASU = session-expired; ASI = signin; SRI = invite-reviewer admin.auth-gate ceiling below operator Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Configuration reference help. Owner backlog shorthand: CON. */
  {
    rowId: "CON",
    path: CONFIGURATION_REFERENCE_HELP_PATH,
    section: "Internal",
    note: "Specialty configuration reference (Admin internal-runbook) - HelpConfigurationReferenceGuideView with SSO wizard / identity-providers / API-keys / configuration-summary primary CTAs, Sources strip (authentication-sign-in, users-and-roles, enterprise-onboarding, cloud-connections, security-trust, data-handling), task sections, claim-discipline callout, PageContextualHelp, collapsed Admin key-catalog appendix, and prepared CONFIGURATION_REFERENCE.md (TB-1327 leakage strip + TB-1330 in-app-only links). Not bare HelpTopicMarkdownView. Admin-gated until catalog remains eng appendix (TB-1329 option b). Score 62/100 (2026-08-08) - surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpConfigurationReferenceGuideView", "SSO wizard", "Admin internal-runbook", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for demo explain proof page. Owner backlog shorthand: DEX. */
  {
    rowId: "DEX",
    path: "/demo/explain",
    section: "Learning",
    note: "Demo explain (Learning) - DemoExplainPageView with PageContextualHelpButton (topic map evidence-trail; Category-1 registry), internal tooling orientation strip (full-operator shell), Learn more / claim-discipline orientation strip, example provenance graph + citations-bound explanation. Sibling WH = /why-archlucid; DPX = /demo/preview; DXX = /demo entry. Buyer-polished shell redirects to /see-it (TB-1322 IA-014). Demo/proof orientation — not a signed-record Sources trail.",
    noteMustContain: ["DemoExplainPageView", "TB-1322", "/see-it"],
  },
  /** Traffic workbook row ID for Connect Azure securely help. Owner backlog shorthand: HC. */
  {
    rowId: "HC",
    path: "/help/cloud-connections/azure",
    section: "Help alias",
    note: "Connect Azure securely help (Help alias) - HelpConnectAzureSecurelyGuideView with PageContextualHelpButton (topic map cloud-connections-azure; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), federation/roles setup, configure CTA. Sibling HCE = parent cloud-connections help; HCA = low-hit template duplicate. Orientation guide - not a signed-record Sources trail. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpConnectAzureSecurelyGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Connect AWS securely help. Owner backlog shorthand: HEC (owner HEW renamed to match template cloud-connections/aws HEC). */
  {
    rowId: "HEC",
    path: "/help/cloud-connections/aws",
    section: "Help alias",
    note: "Connect AWS securely help (Help alias) - HelpConnectAwsSecurelyGuideView with PageContextualHelpButton (topic map cloud-connections-aws; Category-1 registry), claim-discipline orientation strip with Sources, verification callout + Re-poll now deep links, troubleshoot section, OIDC federation identifiers + copyable trust-policy template, manifest-driven IAM permissions table, configure CTA. Sibling HCE = parent cloud-connections help; HC = Azure; HGC = GCP; INC = live AWS settings. Owner HEW renamed to HEC to match template. Orientation guide - not a signed-record Sources trail. Score 58/100 (2026-08-07) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: [
      "HelpConnectAwsSecurelyGuideView",
      "PageContextualHelpButton",
      "Sources",
      "Score 58",
      "cannot improve further toward 80",
    ],
  },
  /** Traffic workbook row ID for Help Center hub. Owner backlog shorthand: HEL. */
  {
    rowId: "HEL",
    path: "/help",
    section: "Help hub",
    note: "Help Center hub (Help hub) - HelpPage with PageContextualHelpButton (Category-1 registry on /help), Guides/Documentation tabs via HelpTabsShell. Sibling HGX = getting-started; HTX = troubleshooting. Not a signed-record Sources trail. Score 72/100 (2026-08-08) - help launcher at core-product Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Connect GCP securely help. Owner backlog shorthand: HGC. */
  {
    rowId: "HGC",
    path: "/help/cloud-connections/gcp",
    section: "Help alias",
    note: "Connect GCP securely help (Help alias) - HelpConnectGcpSecurelyGuideView with PageContextualHelpButton (topic map cloud-connections-gcp; Category-1 registry), claim-discipline orientation strip with Sources, WIF starter panel + manifest-driven GCP roles table, verification scope callout, troubleshoot section, configure CTA. Sibling HCE = parent cloud-connections help; HC = Azure; HEC = AWS; IGC = live GCP settings. Orientation guide - not a signed-record Sources trail. Score 58/100 (2026-08-10) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Pilot feedback / product learning. Owner backlog shorthand: INR. */
  {
    rowId: "INR",
    path: "/internal/product-learning",
    section: "Onboarding",
    note: "Pilot feedback (Onboarding) - ProductLearningPageView at /internal/product-learning with PageContextualHelpButton (topic map pilot-feedback; Category-1 registry), time-range dashboard, planning bridge, exports. Legacy /product-learning hard-retired (404). Sibling HPE = pilot-feedback help; INE = recommendation-learning; PLA = improvement planning. Not a signed-record Sources trail.operator surface at GFN/RE Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["ProductLearningPageView", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for integration event dead letters. Owner backlog shorthand: OID. */
  {
    rowId: "OID",
    path: "/internal/integration-events/dlq",
    section: "Advisory",
    note: "Integration event dead letters (Advisory/Admin ops) - IntegrationEventsDlqPageClient with PageContextualHelpButton (topic map integration-readiness; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, cross-tenant DLQ list + retry/suppress. Internal Operations triage Ã¢â‚¬â€ not a signed-record Sources trail. Sibling IWX = webhooks; IJX = Jira; ADY = system-health.admin KPI/config ceiling below ADY Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["IntegrationEventsDlqPageClient", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for operator Why ArchLucid proof page. Owner backlog shorthand: WH. */
  {
    rowId: "WH",
    path: "/why-archlucid",
    section: "Learning",
    note: "Pilot proof telemetry (Learning) - WhyArchLucidPage with OperatorPageHeader/PageHeading, OperatorPageBreadcrumb, PageContextualHelpButton (topic map how-it-works), internal pilot badge, seeded demo telemetry + sponsor pack sections. Sibling WHY = marketing /why. Buyer-polished shell redirects to showcase executive. Demo/proof orientation — not a signed-record Sources trail.",
    noteMustContain: ["WhyArchLucidPage", "OperatorPageHeader", "marketing /why"],
  },
];
