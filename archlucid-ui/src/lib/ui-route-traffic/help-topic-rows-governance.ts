/** Governance, assurance, and procurement help-topic traffic rows. */

import { API_CONTRACTS_HELP_PATH } from "@/lib/api-contracts-help-route";
import { DPA_TEMPLATE_HELP_PATH } from "@/lib/dpa-template-help-route";
import { FINDINGS_HELP_PATH } from "@/lib/findings/findings-help-route";
import { SOC2_SELF_ASSESSMENT_HELP_PATH } from "@/lib/soc2-self-assessment-help-route";
import type { UiRouteTrafficRow } from "@/lib/ui-route-traffic/types";

export const HELP_TOPIC_TRAFFIC_ROWS_GOVERNANCE: readonly UiRouteTrafficRow[] = [
  /** Traffic workbook row ID for CAIQ / SIG questionnaire help. Owner backlog shorthand: ECA (owner HEC renamed to avoid collision with template cloud-connections/aws HEC). */
  {
    rowId: "ECA",
    path: "/help/caiq-sig-response",
    section: "Help topic",
    note: "CAIQ/SIG response help (Help topic) - HelpTopicMarkdownView with PageContextualHelpButton (topic map caiq-sig-response; Category-1 registry), curated CAIQ_LITE_2026.md + SIG_CORE_2026.md. Sibling SOC = soc2-self-assessment; PRO = procurement; TXX = Trust Center; HE. = catch-all residual. Owner HEC renamed to ECA to avoid collision with template cloud-connections/aws HEC. Not bare HelpTopicMarkdownView without orientation. Score 58/100 (2026-08-07) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Approval help. Owner backlog shorthand: GO. */
  {
    rowId: "GO",
    path: "/help/governance-approval",
    section: "Help topic",
    note: "Specialty approval guide - HelpGovernanceApprovalGuideView with PageContextualHelpButton (topic map governance-approval; Category-1 registry), claim-discipline callout only (no Sources list; TB-2092), stacked role guides, StatusTag status table, workflow stepper, decision outcomes, and collapsed HelpGovernanceApprovalTechnicalReference. Featured help-center product tier (pdfStatus customer). Primary CTAs to /governance/approval-queue, workspace health on ARE (#workspace-health), and /governance/findings. Related docs link to audit-trail not API contracts (TB-1250 / TB-1387). Not bare HelpTopicMarkdownView. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpGovernanceApprovalGuideView", "claim-discipline", "TB-1387", "cannot improve further toward 80"],
    sectionMustNotEqualLower: ["marketing"],
  },
  /** Traffic workbook row ID for Audit trail help. Owner backlog shorthand: H. */
  {
    rowId: "H",
    path: "/help/audit-trail",
    section: "Help topic",
    note: "Audit trail help (Help topic) - HelpAuditTrailGuideView with PageContextualHelpButton (topic map audit-trail; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, primary CTAs to /governance/audit and governance-approval help. Sibling AUD = /governance/audit. Operator orientation Ã¢â‚¬â€ not a signed-record Sources trail. Score 58/100 (2026-08-05) Ã¢â‚¬â€ help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpAuditTrailGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Alerts help. Owner backlog shorthand: HA. */
  {
    rowId: "HA",
    path: "/help/alerts",
    section: "Help topic",
    note: "Alerts help (Help topic) - HelpAlertsGuideView with PageContextualHelpButton (topic map alerts; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), go-to-alerts CTAs, how-alerts-work stepper, workspace readiness strip. Operator orientation guide - not a signed-record Sources trail. Sibling AL = alerts inbox; SAX = alert rules hub. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpAlertsGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Admin diagnostics help. Owner backlog shorthand: HAE. */
  {
    rowId: "HAE",
    path: "/help/admin-diagnostics",
    section: "Help topic",
    note: "Admin diagnostics help (Help topic) - HelpAdminDiagnosticsGuideView with orientation warn callout above content, System health primary header CTA (Admin-tagged), live-surfaces + related Help topic link blocks, illustrative signal table (plain text healthy column), registry provenance (lastReviewed), prepared OPERATOR_ADMIN_DIAGNOSTICS.md. Sibling HDX = eng troubleshooting; HCX = cli-usage; ADY = system-health; HE. = catch-all residual. Not bare HelpTopicMarkdownView.",
    noteMustContain: ["HelpAdminDiagnosticsGuideView", "orientation warn callout", "Admin-tagged", "plain text healthy column"],
    noteMustNotContain: ["claim-discipline"],
  },
  /** Traffic workbook row ID for DPA template help. Owner backlog shorthand: HDP. */
  {
    rowId: "HDP",
    path: DPA_TEMPLATE_HELP_PATH,
    section: "Help topic",
    note: "Specialty DPA negotiation template guide - HelpDpaTemplateGuideView with Trust Center / subprocessors / procurement primary CTAs, Sources diligence strip (security-trust, data-handling, tenant-isolation), orientation steps, claim-discipline callout (template is not countersigned; SOC 2 when available is not CPA attestation), PageContextualHelp, and full DPA_TEMPLATE.md deferred behind collapsed disclosure (TB-1676/1678/1680). TB-1677 leakage strip retained. Help Center product tier + advanced discovery (TB-1679). Not bare HelpTopicMarkdownView. Score 63/100 (2026-08-08) - surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpDpaTemplateGuideView", "not countersigned", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Data handling and tenant isolation help. Owner backlog shorthand: HED (canonical data-handling help). */
  {
    rowId: "HED",
    path: "/help/data-handling",
    section: "Help topic",
    note: "Data handling and tenant isolation help (Help topic) - HelpDataHandlingTenantIsolationGuideView with PageContextualHelpButton (topic map data-handling; Category-1 registry), leaves/stays first-viewport job chrome (TB-1654), React-owned Related topics with Trust Center discovery (TB-1655), Sources diligence strip + claim-discipline callout, residency honesty, Trust/security-trust/audit CTAs, prepared DATA_HANDLING.md. Absorbs retired data-handling-tenant-isolation bookmark (TB-1652 / TB-1658 / Batch B). Not bare HelpTopicMarkdownView. Score 65/100 (2026-08-10) - help-topic orientation hard-caps higher Evidence without sealed-record diligence Sources trail.",
    noteMustContain: ["HelpDataHandlingTenantIsolationGuideView", "Score 65", "TB-1654"],
  },
  /** Traffic workbook row ID for SOC 2 self-assessment help. Owner backlog shorthand: HES. */
  {
    rowId: "HES",
    path: SOC2_SELF_ASSESSMENT_HELP_PATH,
    section: "Help topic",
    note: "Specialty SOC 2 self-assessment guide - HelpSoc2SelfAssessmentGuideView with Trust Center / CAIQ-SIG / procurement primary CTAs, Sources diligence strip (security-trust, DPA, subprocessors, tenant-isolation), job-matrix IA dual (TB-1749), orientation steps, claim-discipline callout (self-assessment is not CPA Type I/II; Type I dates illustrative), PageContextualHelp, and prepared SOC2_SELF_ASSESSMENT_2026.md (TB-1747 leakage strip + TB-1748 roadmap honesty). Title + Help Center product discovery (TB-1750). Not bare HelpTopicMarkdownView. Score 61/100 (2026-08-08) - surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpSoc2SelfAssessmentGuideView", "not CPA", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Subprocessors help. Owner backlog shorthand: HEU. */
  {
    rowId: "HEU",
    path: "/help/subprocessors",
    section: "Help topic",
    note: "Subprocessors help (Help topic) - HelpTopicMarkdownView with PageContextualHelp +, curated subprocessors register (TB-1752/1755 leakage strip). Sibling HDP = DPA template; HSE = security-trust; HED = data-handling. Not bare catch-all help chrome. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Findings help. Owner backlog shorthand: HFX. */
  {
    rowId: "HFX",
    path: FINDINGS_HELP_PATH,
    section: "Help topic",
    note: "Findings help (Help topic) - HelpFindingsGuideView with PageContextualHelpButton (topic map findings; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), anatomy/severity/lifecycle sections, HelpFindingsWorkspaceReadinessStrip (live governance queue). Featured help-center product tier. Primary CTAs to /governance/findings, evidence search, and decision register. Related docs link to audit-trail not API contracts (TB-1250 / TB-1387). Operator orientation - not a signed-record Sources trail. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpFindingsGuideView", "Sources", "TB-1387", "cannot improve further toward 80"],
    sectionMustNotEqualLower: ["marketing"],
  },
  /** Traffic workbook row ID for API contracts technical reference help. Owner backlog shorthand: HG. */
  {
    rowId: "HG",
    path: API_CONTRACTS_HELP_PATH,
    section: "Help topic",
    note: "Specialty Admin API contracts technical reference - HelpApiContractsGuideView with contract-facts landing, OpenAPI primary CTA, Sources strip, technical-reference navigation, and prepared API_CONTRACTS.md (TB-1388 contributor strip). Canonical slug api-contracts; legacy governance-api-contracts redirects here (TB-1386). Admin-gated internal-runbook (TB-1384); de-indexed from product search (TB-1385). Not bare HelpTopicMarkdownView. Score 60/100 (2026-08-08) - surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpApiContractsGuideView", "TB-1386", "TB-1388", "cannot improve further toward 80"],
    sectionMustNotEqualLower: ["marketing"],
  },
  /** Traffic workbook row ID for Security and trust help. Owner backlog shorthand: HSE. */
  {
    rowId: "HSE",
    path: "/help/security-trust",
    section: "Help topic",
    note: "Security and trust help (Help topic) - HelpTopicMarkdownView with PageContextualHelpButton (topic map security-trust; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, curated trust-center markdown. Sibling SEC = /security-trust hub; TXX = /trust. Score 58/100 (2026-08-05) Ã¢â‚¬â€ help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpTopicMarkdownView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Procurement FAQ help. Owner backlog shorthand: PRO. */
  {
    rowId: "PRO",
    path: "/help/procurement",
    section: "Help topic",
    note: "Procurement FAQ help (Help topic) - HelpProcurementGuideView with PageContextualHelpButton (topic map procurement; Category-1 registry), buyer FAQ hero (Procurement FAQ H1), claim-discipline orientation strip, ProcurementHelpDiligenceCtaSection (Trust Center, Security & Trust help, DPA, Subprocessors, NDA/sales pack paths — TB-1256), curated FAQ-only PROCUREMENT_FAQ.md body (TB-1253). Sibling SEC = /security-trust; HSE = /help/security-trust; WSX = settings security-trust. Score 68/100 (2026-08-11) after TB-1253 specialty guide + TB-1256 diligence CTAs — help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.; 2026-08-11 al-ui-rate: Generic HelpTopicMarkdownView FAQ dump without buyer diligence hero; shipped TB-1253 (batch 21–24); open: TB-1254–TB-1257 Done",
    noteMustContain: ["HelpProcurementGuideView", "TB-1253", "TB-1256", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Architecture packages / reviews help. Owner backlog shorthand: REV. */
  {
    rowId: "REV",
    path: "/help/review-packages",
    section: "Help topic",
    note: "Reviews / architecture packages help (Help topic) - HelpReviewPackagesGuideView with PageContextualHelpButton (topic map review-packages; Category-1 registry), informative when-to-use summary, Architecture package definition callout, Getting started five-step workflow, prepared REVIEW_PACKAGES_OPERATOR_GUIDE.md body, compact HelpRelatedGuideCards (review-guide, evidence-intake, findings, evidence-trail, governance-approval). Shared HELP_PAGE_LAYOUT rhythm. Operator orientation guide - not a signed-record Sources trail. Sibling RE = reviews hub; RRE = review workspace. Score 65/100 (2026-08-08) - help-topic package-orientation hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpReviewPackagesGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Architecture scorecard help. Owner backlog shorthand: HAS. */
  {
    rowId: "HAS",
    path: "/help/architecture-scorecard",
    section: "Help topic",
    note: "Architecture scorecard help (Help topic) - HelpArchitectureScorecardGuideView with PageContextualHelpButton (topic map architecture-scorecard; Category-1 registry), scorecard orientation strip, methodology disclosure, sibling report links. Sibling SCX = /insights/architecture-scorecard; EXE = executive-summary. Not bare HelpTopicMarkdownView. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpArchitectureScorecardGuideView", "Score 58", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Recurrence schedules help. Owner backlog shorthand: HRC. */
  {
    rowId: "HRC",
    path: "/help/recurrence-schedules",
    section: "Help topic",
    note: "Recurrence schedules help (Help topic) - HelpRecurrenceSchedulesGuideView with PageContextualHelpButton (topic map recurrence-schedules; Category-1 registry), schedule orientation strip, governance recurrence CTAs. Sibling GRS = /governance/recurrence-schedules. Not bare HelpTopicMarkdownView. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpRecurrenceSchedulesGuideView", "Score 58", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Standards and rules help. Owner backlog shorthand: HSR. */
  {
    rowId: "HSR",
    path: "/help/standards-and-rules",
    section: "Help topic",
    note: "Standards and rules help (Help topic) - HelpStandardsRulesGuideView with PageContextualHelpButton (topic map standards-and-rules; Category-1 registry), standards orientation strip, policy pack library CTAs. Sibling GRS = /governance/standards-and-rules. Not bare HelpTopicMarkdownView. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpStandardsRulesGuideView", "Score 58", "cannot improve further toward 80"],
  },
];
