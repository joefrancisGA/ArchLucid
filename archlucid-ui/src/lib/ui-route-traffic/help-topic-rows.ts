import { API_CONTRACTS_HELP_PATH } from "@/lib/api-contracts-help-route";
import { DEVELOPER_TROUBLESHOOTING_HELP_PATH } from "@/lib/developer-troubleshooting-help-route";
import { DPA_TEMPLATE_HELP_PATH } from "@/lib/dpa-template-help-route";
import { FINDINGS_HELP_PATH } from "@/lib/findings-help-route";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { GETTING_STARTED_HELP_PATH } from "@/lib/getting-started-help-guide-content";
import { PATH_CHOOSER_HELP_PATH } from "@/lib/path-chooser-help-route";
import { SOC2_SELF_ASSESSMENT_HELP_PATH } from "@/lib/soc2-self-assessment-help-route";
import type { UiRouteTrafficRow } from "@/lib/ui-route-traffic/types";

/** Traffic workbook rows for the `help-topic` workbook section. */
export const HELP_TOPIC_TRAFFIC_ROWS: readonly UiRouteTrafficRow[] = [
  /** Traffic workbook row ID for Compare and replay help. Owner backlog shorthand: CO. */
  {
    rowId: "CO",
    path: "/help/comparison-replay",
    section: "Help topic",
    note: "Compare and replay help (Help topic) - HelpComparisonReplayGuideView specialty with PageContextualHelpButton (topic map comparison-replay; Category-1 registry), compare vs validate decision panel, visible Mermaid decision diagram, evidence orientation strip, curated COMPARISON_REPLAY_OPERATOR_GUIDE.md. Sibling CXX = Compare two reviews; REP = Validate review; HRX = repeat-review-loop. Help Center product tier. Score 58/100 (2026-08-07) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/HelpComparisonReplayGuideView|PageContextualHelp|decision panel/i],
  },
  /** Traffic workbook row ID for Your first architecture review help. Owner backlog shorthand: COR (template formerly used HCO; aligned 2026-08-05). */
  {
    rowId: "COR",
    path: FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
    section: "Help topic",
    note: "Your first architecture review (Help topic) - HelpCorePilotGuideView with PageContextualHelpButton (topic map first-architecture-review; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, hero Start review CTA, five-step stepper, gated finalize steps (TB-1040), and Admin-gated folded internal runbooks for printable first-run checklist (FI) and 20-minute first-value (HEF) retired Batch R 2026-08-11. Absorbs former core-pilot / first-pilot-path / first-hour-operator-path / evidence-only-review aliases (retired, TB-2050). Not bare HelpTopicMarkdownView. Sibling HP = pilot-guide. Score 58/100 (2026-08-05) Ã¢â‚¬â€ help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpCorePilotGuideView", "cannot improve further toward 80"],
    sectionMustNotEqualLower: ["marketing"],
  },
  /** Traffic workbook row ID for CAIQ / SIG questionnaire help. Owner backlog shorthand: ECA (owner HEC renamed to avoid collision with template cloud-connections/aws HEC). */
  {
    rowId: "ECA",
    path: "/help/caiq-sig-response",
    section: "Help topic",
    note: "CAIQ/SIG response help (Help topic) - HelpTopicMarkdownView with PageContextualHelpButton (topic map caiq-sig-response; Category-1 registry), curated CAIQ_LITE_2026.md + SIG_CORE_2026.md. Sibling SOC = soc2-self-assessment; PRO = procurement; TXX = Trust Center; HE. = catch-all residual. Owner HEC renamed to ECA to avoid collision with template cloud-connections/aws HEC. Not bare HelpTopicMarkdownView without orientation. Score 58/100 (2026-08-07) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Evidence graph / evidence-trail help. Owner backlog shorthand: EV. */
  {
    rowId: "EV",
    path: "/help/evidence-trail",
    section: "Help topic",
    note: "Evidence trail help (Help topic) - HelpEvidenceTrailGuideView with PageContextualHelpButton (topic map evidence-trail; Category-1 registry), Open Evidence graph + Load + Open sample primary CTAs, finding trace vs provenance graph jump panel, claim-discipline callout, collapsed EVIDENCE_TRAIL_OPERATOR_GUIDE.md reference body with Mermaid lineage diagram, and in-app related guides (TB-1360-TB-1364). Not bare HelpTopicMarkdownView. Sibling INE = /insights/evidence-graph; DEX = /demo/explain. Score 58/100 (2026-08-05) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpEvidenceTrailGuideView", "Open Evidence graph", "Not bare HelpTopicMarkdownView", "cannot improve further toward 80"],
    noteMustNotContain: ["Ã¢â‚¬â€"],
  },
  /** Traffic workbook row ID for Start a review / evidence-intake help. Owner backlog shorthand: EVI. */
  {
    rowId: "EVI",
    path: "/help/evidence-intake",
    section: "Help topic",
    note: "Evidence intake help (Help topic) - HelpEvidenceIntakeGuideView with PageContextualHelpButton (topic map evidence-intake; Category-1 registry), Start review + cloud connections primary CTAs, three-path wizard strip, verify-intake actionable panel, claim-discipline callout, collapsed EVIDENCE_INTAKE_OPERATOR_GUIDE.md reference body, and in-app related guides (TB-1350-TB-1354). Not bare HelpTopicMarkdownView. Sibling RNX = /reviews/new; COR = first-architecture-review. Score 58/100 (2026-08-05) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpEvidenceIntakeGuideView", "claim-discipline callout", "Start review", "Not bare HelpTopicMarkdownView", "cannot improve further toward 80"],
    noteMustNotContain: ["Ã¢â‚¬â€"],
  },
  /** Traffic workbook row ID for Governance approval help. Owner backlog shorthand: GO. */
  {
    rowId: "GO",
    path: "/help/governance-approval",
    section: "Help topic",
    note: "Specialty governance approval guide - HelpGovernanceApprovalGuideView with PageContextualHelpButton (topic map governance-approval; Category-1 registry), claim-discipline callout only (no Sources list; TB-2092), stacked role guides, StatusTag status table, workflow stepper, decision outcomes, and collapsed HelpGovernanceApprovalTechnicalReference. Featured help-center product tier (pdfStatus customer). Primary CTAs to /governance/approval-queue, workspace health on ARE (#workspace-health), and /governance/findings. Related docs link to audit-trail not API contracts (TB-1250 / TB-1387). Not bare HelpTopicMarkdownView. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpGovernanceApprovalGuideView", "claim-discipline", "TB-1387", "cannot improve further toward 80"],
    sectionMustNotEqualLower: ["marketing"],
  },
  /** Traffic workbook row ID for Audit trail help. Owner backlog shorthand: H. */
  {
    rowId: "H",
    path: "/help/audit-trail",
    section: "Help topic",
    note: "Audit trail help (Help topic) - HelpAuditTrailGuideView with PageContextualHelpButton (topic map audit-trail; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, primary CTAs to /governance/audit and governance-approval help. Sibling AUD = /governance/audit. Operator orientation Ã¢â‚¬â€ not a signed-record Sources trail. Score 58/100 (2026-08-05) Ã¢â‚¬â€ help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpAuditTrailGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Alerts help. Owner backlog shorthand: HA. */
  {
    rowId: "HA",
    path: "/help/alerts",
    section: "Help topic",
    note: "Alerts help (Help topic) - HelpAlertsGuideView with PageContextualHelpButton (topic map alerts; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), go-to-alerts CTAs, how-alerts-work stepper, workspace readiness strip. Operator orientation guide - not a signed-record Sources trail. Sibling AL = alerts inbox; SAX = alert rules hub. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
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
  /** Traffic workbook row ID for Accelerator chooser help. Owner backlog shorthand: HAX. */
  {
    rowId: "HAX",
    path: "/help/accelerator-chooser",
    section: "Help topic",
    note: "Pick a starter proof pack help (Help topic) - HelpAcceleratorChooserGuideView with PageContextualHelpButton (topic map accelerator-chooser; Category-1 registry), claim-discipline orientation strip, prerequisite panel, per-pack Start CTAs from ACCELERATOR_CHOOSER_ENTRIES (technical inputs behind disclosure), workflow steps with baseline/quick-review links. No GTM/V1.1 out-of-scope roadmap band (buyer-safe; claim discipline only). Sibling HPX = path-chooser; COR = first-architecture-review; HE. = catch-all residual. Not bare HelpTopicMarkdownView. Score 68/100 (2026-08-09) - specialty chooser chrome with Start CTAs; help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: [
      "HelpAcceleratorChooserGuideView",
      "Score 68",
      "cannot improve further toward 80",
    ],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline|accelerator-chooser/i],
  },
  /** Traffic workbook row ID for Billing and plans help. Owner backlog shorthand: HBX. */
  {
    rowId: "HBX",
    path: "/help/billing-and-plans",
    section: "Help topic",
    note: "Billing and plans help (Help topic) - HelpBillingAndPlansGuideView with PageContextualHelpButton (topic map billing-and-plans; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), plan CTAs, prepared billing guide body. Orientation guide - not a signed-record Sources trail. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpBillingAndPlansGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Cloud connections help topic. Owner backlog shorthand: HCE. */
  {
    rowId: "HCE",
    path: "/help/cloud-connections",
    section: "Help topic",
    note: "Cloud connections help (Help topic) - HelpCloudConnectionsGuideView with PageContextualHelpButton (topic map cloud-connections; Category-1 registry), Learn more / claim-discipline orientation (Sources follow-up removed TB-2092), hub/Azure CTAs, curated CLOUD_CONNECTIONS.md body. Orientation guide - not a signed-record Sources trail. Sibling HC = Azure secure-connect alias. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpCloudConnectionsGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for CLI usage help. Owner backlog shorthand: HCX. */
  {
    rowId: "HCX",
    path: "/help/cli-usage",
    section: "Help topic",
    note: "CLI usage help (Help topic) - HelpCliUsageTechnicalReferenceView with PageContextualHelpButton (topic map cli-usage; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, engineering runbook landing + CLI_USAGE.md. Sibling HDX = developer-troubleshooting; HTX = customer troubleshooting. Internal-runbook Ã¢â‚¬â€ not customer diligence. Score 58/100 (2026-08-05) Ã¢â‚¬â€ help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpCliUsageTechnicalReferenceView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for DPA template help. Owner backlog shorthand: HDP. */
  {
    rowId: "HDP",
    path: DPA_TEMPLATE_HELP_PATH,
    section: "Help topic",
    note: "Specialty DPA negotiation template guide - HelpDpaTemplateGuideView with Trust Center / subprocessors / procurement primary CTAs, Sources diligence strip (security-trust, data-handling, tenant-isolation), orientation steps, claim-discipline callout (template is not countersigned; SOC 2 when available is not CPA attestation), PageContextualHelp, and full DPA_TEMPLATE.md deferred behind collapsed disclosure (TB-1676/1678/1680). TB-1677 leakage strip retained. Help Center product tier + advanced discovery (TB-1679). Not bare HelpTopicMarkdownView. Score 63/100 (2026-08-08) - surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpDpaTemplateGuideView", "not countersigned", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Engineering troubleshooting runbook help. Owner backlog shorthand: HDX. */
  {
    rowId: "HDX",
    path: DEVELOPER_TROUBLESHOOTING_HELP_PATH,
    section: "Help topic",
    note: "Specialty engineering troubleshooting runbook (Admin internal-runbook, TB-1246) - HelpEngineeringTroubleshootingGuideView with runbook overview landing, Customer Troubleshooting primary CTA + secondary link row, linked symptom escalation artifacts, Sources diligence strip (admin-diagnostics, configuration-reference), info claim-discipline callout, PageContextualHelp, HelpTopicAuthorityGate + HelpTopicMarkdownClient specialty branch, and prepared TROUBLESHOOTING.md + COMMON_ERRORS.md (contributor ADR/TB link strip). Help search Advanced diagnostics (adminOnly). Not in customer Help Center featured grid. Customer Troubleshooting (HTX) does not deep-link here (TB-1249). Slug remains developer-troubleshooting pending TB-1248 rename.help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpTopicAuthorityGate", "HelpEngineeringTroubleshootingGuideView", "TB-1249", "cannot improve further toward 80"],
    noteMustNotContain: ["Not a specialty guide"],
    sectionMustNotEqualLower: ["marketing"],
  },
  /** Traffic workbook row ID for help topic catch-all dispatcher. Owner backlog shorthand: HE. */
  {
    rowId: "HE.",
    path: "/help/[...topic]",
    section: "Help topic",
    note: "Help topic catch-all (Help topic) - App Router /help/[...topic] dispatcher mounts specialty guides (HA/GO/HR/HFX/...) or HelpTopicMarkdownView for residual curated markdown. Residual default path ships + PageContextualHelpButton (Category-1 /help fallback; longer specialty prefixes win). Specialty siblings own richer chrome on their rows. Not a signed-record Sources trail. Score 58/100 (2026-08-08) - help catch-all residual hard-caps at specialty orientation band. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["PageContextualHelpButton", "Score 58", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Azure permissions help. Owner backlog shorthand: HE (template formerly HAZ at lower Hit%). */
  {
    rowId: "HE",
    path: "/help/azure-permissions",
    section: "Help topic",
    note: "Azure permissions help (Help topic) - HelpAzurePermissionsGuideView with PageContextualHelpButton (topic map azure-permissions; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, permissions matrix, setup and verify panels. Not bare HelpTopicMarkdownView. Sibling HC = Connect Azure securely; HCE = cloud-connections help. Score 58/100 (2026-08-04) Ã¢â‚¬â€ help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpAzurePermissionsGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Authentication and sign-in help. Owner backlog shorthand: HEA. */
  {
    rowId: "HEA",
    path: "/help/authentication-sign-in",
    section: "Help topic",
    note: "Authentication sign-in help (Help topic) - HelpTopicMarkdownView with PageContextualHelpButton (topic map authentication-sign-in; Category-1 registry), curated authentication/sign-in markdown. Sibling HOE = users-and-roles; ADS = account-security; CON = configuration-reference; HE. = catch-all residual. Not bare HelpTopicMarkdownView without orientation. Score 58/100 (2026-08-07) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Data handling and tenant isolation help. Owner backlog shorthand: HED (canonical data-handling help). */
  {
    rowId: "HED",
    path: "/help/data-handling",
    section: "Help topic",
    note: "Data handling and tenant isolation help (Help topic) - HelpDataHandlingTenantIsolationGuideView with PageContextualHelpButton (topic map data-handling; Category-1 registry), leaves/stays first-viewport job chrome (TB-1654), React-owned Related topics with Trust Center discovery (TB-1655), Sources diligence strip + claim-discipline callout, residency honesty, Trust/security-trust/audit CTAs, prepared DATA_HANDLING.md. Absorbs retired data-handling-tenant-isolation bookmark (TB-1652 / TB-1658 / Batch B). Not bare HelpTopicMarkdownView. Score 65/100 (2026-08-10) - help-topic orientation hard-caps higher Evidence without signed-record diligence Sources trail.",
    noteMustContain: ["HelpDataHandlingTenantIsolationGuideView", "Score 65", "TB-1654"],
  },
  /** Traffic workbook row ID for Integration readiness help. Owner backlog shorthand: HEI. */
  {
    rowId: "HEI",
    path: "/help/integration-readiness",
    section: "Help topic",
    note: "Integration readiness help (Help topic) - HelpTopicMarkdownView with PageContextualHelpButton (topic map integration-readiness; Category-1 registry), Connection status header primary action, claim-discipline orientation strip + diligence artifact index, curated INTEGRATION_READINESS.md. Sibling IJX/ISX/INA = live ITSM settings; ACS = connection-status; HEZ = azure-boards help. Not bare HelpTopicMarkdownView without orientation. Score 58/100 (2026-08-07) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for SOC 2 self-assessment help. Owner backlog shorthand: HES. */
  {
    rowId: "HES",
    path: SOC2_SELF_ASSESSMENT_HELP_PATH,
    section: "Help topic",
    note: "Specialty SOC 2 self-assessment guide - HelpSoc2SelfAssessmentGuideView with Trust Center / CAIQ-SIG / procurement primary CTAs, Sources diligence strip (security-trust, DPA, subprocessors, tenant-isolation), job-matrix IA dual (TB-1749), orientation steps, claim-discipline callout (self-assessment is not CPA Type I/II; Type I dates illustrative), PageContextualHelp, and prepared SOC2_SELF_ASSESSMENT_2026.md (TB-1747 leakage strip + TB-1748 roadmap honesty). Title + Help Center product discovery (TB-1750). Not bare HelpTopicMarkdownView. Score 61/100 (2026-08-08) - surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpSoc2SelfAssessmentGuideView", "not CPA", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Subprocessors help. Owner backlog shorthand: HEU. */
  {
    rowId: "HEU",
    path: "/help/subprocessors",
    section: "Help topic",
    note: "Subprocessors help (Help topic) - HelpTopicMarkdownView with PageContextualHelp +, curated subprocessors register (TB-1752/1755 leakage strip). Sibling HDP = DPA template; HSE = security-trust; HED = data-handling. Not bare catch-all help chrome. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Enterprise onboarding help. Owner backlog shorthand: HEX. */
  {
    rowId: "HEX",
    path: "/help/enterprise-onboarding",
    section: "Help topic",
    note: "Enterprise onboarding help (Help topic) - HelpEnterpriseOnboardingGuideView with PageContextualHelpButton (topic map enterprise-onboarding; Category-1 registry), Configure SSO / identity / users / cloud primary CTAs, eight-step hub checklist, claim-discipline orientation strip, and prepared HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md appendix. Not bare HelpTopicMarkdownView. Sibling identity-providers settings; HOE = users-and-roles; COR = first-architecture-review. Score 58/100 (2026-08-05) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpEnterpriseOnboardingGuideView", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Azure Boards help. Owner backlog shorthand: HEZ. */
  {
    rowId: "HEZ",
    path: "/help/azure-boards",
    section: "Help topic",
    note: "Specialty Azure Boards help - HelpAzureBoardsGuideView with PageContextualHelpButton first in header (topic map azure-boards; Category-1 registry), h1 title, document StatusTag, HelpTopicRegistryProvenanceLine, PAT warn callout, authority prerequisite line, live connection StatusTag via HelpAzureBoardsConnectionContext (or honest absent copy), curated AZURE_BOARDS_INTEGRATION.md body. Absorbs retired integrations/azure-boards bookmark. Sibling INZ = live Azure Boards settings; HEI = integration-readiness. Not bare HelpTopicMarkdownView. Score 58/100 (2026-08-07) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Findings help. Owner backlog shorthand: HFX. */
  {
    rowId: "HFX",
    path: FINDINGS_HELP_PATH,
    section: "Help topic",
    note: "Findings help (Help topic) - HelpFindingsGuideView with PageContextualHelpButton (topic map findings; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), anatomy/severity/lifecycle sections, HelpFindingsWorkspaceReadinessStrip (live governance queue). Featured help-center product tier. Primary CTAs to /governance/findings, evidence search, and decision register. Related docs link to audit-trail not API contracts (TB-1250 / TB-1387). Operator orientation - not a signed-record Sources trail. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpFindingsGuideView", "Sources", "TB-1387", "cannot improve further toward 80"],
    sectionMustNotEqualLower: ["marketing"],
  },
  /** Traffic workbook row ID for API contracts technical reference help. Owner backlog shorthand: HG. */
  {
    rowId: "HG",
    path: API_CONTRACTS_HELP_PATH,
    section: "Help topic",
    note: "Specialty Admin API contracts technical reference - HelpApiContractsGuideView with contract-facts landing, OpenAPI primary CTA, Sources strip, technical-reference navigation, and prepared API_CONTRACTS.md (TB-1388 contributor strip). Canonical slug api-contracts; legacy governance-api-contracts redirects here (TB-1386). Admin-gated internal-runbook (TB-1384); de-indexed from product search (TB-1385). Not bare HelpTopicMarkdownView. Score 60/100 (2026-08-08) - surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpApiContractsGuideView", "TB-1386", "TB-1388", "cannot improve further toward 80"],
    sectionMustNotEqualLower: ["marketing"],
  },
  /** Traffic workbook row ID for Glossary help. Owner backlog shorthand: HGE (template formerly HEG at lower Hit%). */
  {
    rowId: "HGE",
    path: "/help/glossary",
    section: "Help topic",
    note: "Glossary help (Help topic) - HelpGlossaryPageView with PageContextualHelpButton (topic map glossary; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, searchable term browser. Not bare HelpTopicMarkdownView. Score 58/100 (2026-08-04) Ã¢â‚¬â€ help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpGlossaryPageView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Getting started help. Owner backlog shorthand: HGX. */
  {
    rowId: "HGX",
    path: GETTING_STARTED_HELP_PATH,
    section: "Help topic",
    note: "Getting started help (Help topic) - HelpGettingStartedGuideView with PageContextualHelpButton (topic map getting-started; Category-1 registry), Learn more / claim-discipline orientation (Sources follow-up removed TB-2092), quick-start CTAs, workflow stepper, vocabulary. Absorbs former how-it-works twin (alias retired, TB-2050). Orientation guide - not a signed-record Sources trail. Score 58/100 (2026-08-08) - featured help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpGettingStartedGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Pilot guide help. Owner backlog shorthand: HP. */
  {
    rowId: "HP",
    path: "/help/pilot-guide",
    section: "Help topic",
    note: "Pilot guide help (Help topic) - HelpPilotGuideView with PageContextualHelpButton (topic map pilot-guide; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), pilot workflow CTAs, prepared pilot guide body. Absorbs retired pilot-nav-profile twin (PIL folded into HP, TB-1721). Orientation guide - not a signed-record Sources trail. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpPilotGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Pilot feedback help. Owner backlog shorthand: HPE. */
  {
    rowId: "HPE",
    path: "/help/pilot-feedback",
    section: "Help topic",
    note: "Pilot feedback help (Help topic) - HelpPilotFeedbackGuideView with PageContextualHelpButton (topic map pilot-feedback; Category-1 registry), claim-discipline orientation strip, Open Pilot feedback CTA, workflow stepper, job-matrix IA dual, curated PRODUCT_LEARNING.md (TB-1717 leakage strip). Sibling INR = live /internal/product-learning; INE = recommendation-learning; PLA = improvement planning. Not bare HelpTopicMarkdownView without orientation. Score 58/100 (2026-08-07) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Prior manifest retrieval help. Owner backlog shorthand: HPR. */
  {
    rowId: "HPR",
    path: "/help/prior-manifest-retrieval",
    section: "Help topic",
    note: "Prior manifest retrieval help (Help topic) - HelpTopicMarkdownView with PageContextualHelp +, curated PRIOR_MANIFEST_RETRIEVAL_GUIDE.md (TB-1733 host-config strip). Sibling ISE = search; INS = Ask; SI = signed records. Not bare catch-all help chrome. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Choose your next step help. Owner backlog shorthand: HPX. */
  {
    rowId: "HPX",
    path: PATH_CHOOSER_HELP_PATH,
    section: "Help topic",
    note: "Path chooser help (Help topic) - HelpPathChooserGuideView with PageContextualHelpButton (topic map path-chooser; Category-1 registry), Start review CTA, four-step evaluator session strip, goal-branch primary/alternate CTAs (reviews/new, security-trust, first-architecture-review, executive-summary, CLI), collapsed buyer-orientation reference appendix, related next steps card (TB-1345/TB-1349; TB-1712 leakage strip). Sibling HEE = evaluator-workbook alias; HAX = accelerator-chooser. Not bare HelpTopicMarkdownView. Score 64/100 (2026-08-10) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail.",
    noteMustContain: ["HelpPathChooserGuideView", "related next steps card", "Score 64"],
    sectionMustNotEqualLower: ["marketing"],
  },
  /** Traffic workbook row ID for Review guide help. Owner backlog shorthand: HR. */
  {
    rowId: "HR",
    path: "/help/review-guide",
    section: "Help topic",
    note: "Review guide help (Help topic) - HelpReviewGuideView with PageContextualHelpButton (topic map review-guide; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), start-review CTAs, prepared REVIEW_GUIDE.md body. Canon for wizard field-reference; absorbs former creating-runs / starting-reviews aliases via permanent redirect (TB-1258). Not bare HelpTopicMarkdownView. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.; 2026-08-11 al-ui-rate: Duplicate starting-reviews registry slug split traffic from review-guide; shipped TB-1258 (batch 21–24); open: TB-1259–TB-1262 Done",
    noteMustContain: ["HelpReviewGuideView", "TB-1258", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Report a problem help. Owner backlog shorthand: HRE. */
  {
    rowId: "HRE",
    path: "/help/report-a-problem",
    section: "Help topic",
    note: "Report a problem help (Help topic) - HelpTopicMarkdownView with PageContextualHelp +, curated REPORT_A_PROBLEM.md (support overclaim guard). Sibling HTX = troubleshooting; HDX = engineering troubleshooting; ASX = support workspace. Not bare catch-all help chrome. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Repeat-review loop help. Owner backlog shorthand: HRX. */
  {
    rowId: "HRX",
    path: "/help/repeat-review-loop",
    section: "Help topic",
    note: "Repeat-review loop help (Help topic) - HelpRepeatReviewLoopGuideView with PageContextualHelpButton (topic map repeat-review-loop; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, start-loop CTAs, prepared SECOND_RUN / REPEAT_REVIEW_LOOP markdown. Sibling CXX = compare-two-reviews; REP = /replay; COR = first-architecture-review. Score 58/100 (2026-08-05) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpRepeatReviewLoopGuideView", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Specialty walkthroughs help. Owner backlog shorthand: HS. */
  {
    rowId: "HS",
    path: "/help/specialty-walkthroughs",
    section: "Help topic",
    note: "Specialty walkthroughs help (Help topic) - HelpSpecialtyWalkthroughTemplatesView with PageContextualHelp +, template catalog CTAs into Start review. Sibling RNX = reviews/new; HPX = path-chooser; COR = first-architecture-review. Not bare catch-all help chrome. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Security and trust help. Owner backlog shorthand: HSE. */
  {
    rowId: "HSE",
    path: "/help/security-trust",
    section: "Help topic",
    note: "Security and trust help (Help topic) - HelpTopicMarkdownView with PageContextualHelpButton (topic map security-trust; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, curated trust-center markdown. Sibling SEC = /security-trust hub; TXX = /trust. Score 58/100 (2026-08-05) Ã¢â‚¬â€ help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpTopicMarkdownView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Workspace and scope guide help. Owner backlog shorthand: HSX. */
  {
    rowId: "HSX",
    path: "/help/scope",
    section: "Help topic",
    note: "Workspace and scope help (Help topic) - HelpTopicMarkdownView with PageContextualHelpButton (topic map scope; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, curated WORKSPACE_SCOPE_GUIDE markdown. Sibling HOE = users-and-roles. Score 58/100 (2026-08-05) Ã¢â‚¬â€ help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpTopicMarkdownView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Troubleshooting help. Owner backlog shorthand: HTX. */
  {
    rowId: "HTX",
    path: "/help/troubleshooting",
    section: "Help topic",
    note: "Troubleshooting help (Help topic) - HelpTroubleshootingGuideView with PageContextualHelpButton (topic map troubleshooting; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), start-here CTAs, common issues, advanced diagnostics. Operator unblocking guide - not a signed-record Sources trail. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpTroubleshootingGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Procurement FAQ help. Owner backlog shorthand: PRO. */
  {
    rowId: "PRO",
    path: "/help/procurement",
    section: "Help topic",
    note: "Procurement FAQ help (Help topic) - HelpProcurementGuideView with PageContextualHelpButton (topic map procurement; Category-1 registry), buyer FAQ hero (Procurement FAQ H1), claim-discipline orientation strip, ProcurementHelpDiligenceCtaSection (Trust Center, Security & trust help, DPA, Subprocessors, NDA/sales pack paths — TB-1256), curated FAQ-only PROCUREMENT_FAQ.md body (TB-1253). Sibling SEC = /security-trust; HSE = /help/security-trust; WSX = settings security-trust. Score 68/100 (2026-08-11) after TB-1253 specialty guide + TB-1256 diligence CTAs — help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.; 2026-08-11 al-ui-rate: Generic HelpTopicMarkdownView FAQ dump without buyer diligence hero; shipped TB-1253 (batch 21–24); open: TB-1254–TB-1257 Done",
    noteMustContain: ["HelpProcurementGuideView", "TB-1253", "TB-1256", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Architecture packages / reviews help. Owner backlog shorthand: REV. */
  {
    rowId: "REV",
    path: "/help/review-packages",
    section: "Help topic",
    note: "Reviews / architecture packages help (Help topic) - HelpReviewPackagesGuideView with PageContextualHelpButton (topic map review-packages; Category-1 registry), informative when-to-use summary, Architecture package definition callout, Getting started five-step workflow, prepared REVIEW_PACKAGES_OPERATOR_GUIDE.md body, compact HelpRelatedGuideCards (review-guide, evidence-intake, findings, evidence-trail, governance-approval). Shared HELP_PAGE_LAYOUT rhythm. Operator orientation guide - not a signed-record Sources trail. Sibling RE = reviews hub; RRE = review workspace. Score 65/100 (2026-08-08) - help-topic package-orientation hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpReviewPackagesGuideView", "Sources", "cannot improve further toward 80"],
  },
];
