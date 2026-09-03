/** Pilot, onboarding, and operator-workflow help-topic traffic rows. */

import {
  HELP_TOPIC_CATCHALL_TRAFFIC_NOTE,
  HELP_TOPIC_CATCHALL_TRAFFIC_PATH,
  HELP_TOPIC_CATCHALL_TRAFFIC_ROW_ID,
  HELP_TOPIC_CATCHALL_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-help-topic-catchall";
import { ENGINEERING_TROUBLESHOOTING_HELP_PATH } from "@/lib/developer-troubleshooting-help-route";
import { DPA_TEMPLATE_HELP_PATH } from "@/lib/dpa-template-help-route";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { GETTING_STARTED_HELP_PATH } from "@/lib/getting-started-help-guide-content";
import { PATH_CHOOSER_HELP_PATH } from "@/lib/path-chooser-help-route";
import type { UiRouteTrafficRow } from "@/lib/ui-route-traffic/types";

export const HELP_TOPIC_TRAFFIC_ROWS_PILOT: readonly UiRouteTrafficRow[] = [
  /** Traffic workbook row ID for Compare and replay help. Owner backlog shorthand: CO. */
  {
    rowId: "CO",
    path: "/help/comparison-replay",
    section: "Help topic",
    note: "Compare and replay help (Help topic) - HelpComparisonReplayGuideView specialty with PageContextualHelpButton (topic map comparison-replay; Category-1 registry), compare vs validate decision panel, visible Mermaid decision diagram, evidence orientation strip, curated COMPARISON_REPLAY_OPERATOR_GUIDE.md. Sibling CXX = Compare two reviews; REP = Validate review; HRX = repeat-review-loop. Help Center product tier. Score 58/100 (2026-08-07) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/HelpComparisonReplayGuideView|PageContextualHelp|decision panel/i],
  },
  /** Traffic workbook row ID for Your first architecture review help. Owner backlog shorthand: COR (template formerly used HCO; aligned 2026-08-05). */
  {
    rowId: "COR",
    path: FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
    section: "Help topic",
    note: "Your first architecture review (Help topic) - HelpCorePilotGuideView with PageContextualHelpButton (topic map first-architecture-review; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, hero Start review CTA, five-step stepper, gated finalize steps (TB-1040), and Admin-gated folded internal runbooks for printable first-run checklist (FI) and 20-minute first-value (HEF) retired Batch R 2026-08-11. Absorbs former core-pilot / first-pilot-path / first-hour-operator-path / evidence-only-review aliases (retired, TB-2050). Not bare HelpTopicMarkdownView. Sibling HP = pilot-guide. Score 58/100 (2026-08-05) Ã¢â‚¬â€ help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpCorePilotGuideView", "cannot improve further toward 80"],
    sectionMustNotEqualLower: ["marketing"],
  },
  /** Traffic workbook row ID for Evidence graph / evidence-trail help. Owner backlog shorthand: EV. */
  {
    rowId: "EV",
    path: "/help/evidence-trail",
    section: "Help topic",
    note: "Evidence trail help (Help topic) - HelpEvidenceTrailGuideView with PageContextualHelpButton (topic map evidence-trail; Category-1 registry), Open Evidence graph + Load + Open sample primary CTAs, finding trace vs provenance graph jump panel, claim-discipline callout, collapsed EVIDENCE_TRAIL_OPERATOR_GUIDE.md reference body with Mermaid lineage diagram, and in-app related guides (TB-1360-TB-1364). Not bare HelpTopicMarkdownView. Sibling INE = /insights/evidence-graph; DEX = /demo/explain. Score 58/100 (2026-08-05) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpEvidenceTrailGuideView", "Open Evidence graph", "Not bare HelpTopicMarkdownView", "cannot improve further toward 80"],
    noteMustNotContain: ["Ã¢â‚¬â€"],
  },
  /** Traffic workbook row ID for Start a review / evidence-intake help. Owner backlog shorthand: EVI. */
  {
    rowId: "EVI",
    path: "/help/evidence-intake",
    section: "Help topic",
    note: "Evidence intake help (Help topic) - HelpEvidenceIntakeGuideView with PageContextualHelpButton (topic map evidence-intake; Category-1 registry), Start review + cloud connections primary CTAs, three-path wizard strip, verify-intake actionable panel, claim-discipline callout, collapsed EVIDENCE_INTAKE_OPERATOR_GUIDE.md reference body, and in-app related guides (TB-1350-TB-1354). Not bare HelpTopicMarkdownView. Sibling RNX = /reviews/new; COR = first-architecture-review. Score 58/100 (2026-08-05) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpEvidenceIntakeGuideView", "claim-discipline callout", "Start review", "Not bare HelpTopicMarkdownView", "cannot improve further toward 80"],
    noteMustNotContain: ["Ã¢â‚¬â€"],
  },
  /** Traffic workbook row ID for Accelerator chooser help. Owner backlog shorthand: HAX. */
  {
    rowId: "HAX",
    path: "/help/accelerator-chooser",
    section: "Help topic",
    note: "Pick a starter proof pack help (Help topic) - HelpAcceleratorChooserGuideView with PageContextualHelpButton (topic map accelerator-chooser; Category-1 registry), claim-discipline orientation strip, prerequisite panel, per-pack Start CTAs from ACCELERATOR_CHOOSER_ENTRIES (technical inputs behind disclosure), workflow steps with baseline/quick-review links. No GTM/V1.1 out-of-scope roadmap band (buyer-safe; claim discipline only). Sibling HPX = path-chooser; COR = first-architecture-review; HE. = catch-all residual. Not bare HelpTopicMarkdownView. Score 68/100 (2026-08-09) - specialty chooser chrome with Start CTAs; help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
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
    note: "Billing and plans help (Help topic) - HelpBillingAndPlansGuideView with PageContextualHelpButton (topic map billing-and-plans; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), plan CTAs, prepared billing guide body. Orientation guide - not a signed-record Sources trail. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpBillingAndPlansGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for CLI usage help. Owner backlog shorthand: HCX. */
  {
    rowId: "HCX",
    path: "/help/cli-usage",
    section: "Help topic",
    note: "CLI usage help (Help topic) - HelpCliUsageTechnicalReferenceView with PageContextualHelpButton (topic map cli-usage; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, engineering runbook landing + CLI_USAGE.md. Sibling HDX = engineering-troubleshooting; HTX = customer troubleshooting. Internal-runbook Ã¢â‚¬â€ not customer diligence. Score 58/100 (2026-08-05) Ã¢â‚¬â€ help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpCliUsageTechnicalReferenceView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Engineering troubleshooting runbook help. Owner backlog shorthand: HDX. */
  {
    rowId: "HDX",
    path: ENGINEERING_TROUBLESHOOTING_HELP_PATH,
    section: "Help topic",
    note: "Specialty engineering troubleshooting runbook (Admin internal-runbook, TB-1246) - HelpEngineeringTroubleshootingGuideView with runbook overview landing, Customer Troubleshooting primary CTA + secondary link row, linked symptom escalation artifacts, Sources diligence strip (admin-diagnostics, configuration-reference), info claim-discipline callout, PageContextualHelp, HelpTopicAuthorityGate + HelpTopicMarkdownClient specialty branch, and prepared TROUBLESHOOTING.md + COMMON_ERRORS.md (contributor ADR/TB link strip). Help search Advanced diagnostics (adminOnly). Not in customer Help Center featured grid. Customer Troubleshooting (HTX) does not deep-link here (TB-1249). Canonical slug engineering-troubleshooting with permanent redirect from developer-troubleshooting (TB-1248). help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpTopicAuthorityGate", "HelpEngineeringTroubleshootingGuideView", "TB-1249", "cannot improve further toward 80"],
    noteMustNotContain: ["Not a specialty guide"],
    sectionMustNotEqualLower: ["marketing"],
  },
  /** Traffic workbook row ID for help topic catch-all dispatcher. Owner backlog shorthand: HE. */
  {
    rowId: HELP_TOPIC_CATCHALL_TRAFFIC_ROW_ID,
    path: HELP_TOPIC_CATCHALL_TRAFFIC_PATH,
    section: HELP_TOPIC_CATCHALL_TRAFFIC_SECTION,
    note: HELP_TOPIC_CATCHALL_TRAFFIC_NOTE,
    noteMustContain: [
      "Router meta",
      "not a standalone buyer URL",
      "Per-slug help workbook rows",
      "router/dispatch hygiene only",
      "TB-1601",
    ],
    noteMustNotContain: ["Score 58", "cannot improve further toward 80"],
    sectionMustNotEqual: ["Help topic"],
  },
  /** Traffic workbook row ID for Authentication and sign-in help. Owner backlog shorthand: HEA. */
  {
    rowId: "HEA",
    path: "/help/authentication-sign-in",
    section: "Help topic",
    note: "Authentication sign-in help (Help topic) - HelpTopicMarkdownView with PageContextualHelpButton (topic map authentication-sign-in; Category-1 registry), curated authentication/sign-in markdown. Sibling HOE = users-and-roles; ADS = account-security; CON = configuration-reference; HE. = catch-all residual. Not bare HelpTopicMarkdownView without orientation. Score 58/100 (2026-08-07) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Enterprise onboarding help. Owner backlog shorthand: HEX. */
  {
    rowId: "HEX",
    path: "/help/enterprise-onboarding",
    section: "Help topic",
    note: "Enterprise onboarding help (Help topic) - HelpEnterpriseOnboardingGuideView with PageContextualHelpButton (topic map enterprise-onboarding; Category-1 registry), Configure SSO / identity / users / cloud primary CTAs, eight-step hub checklist, claim-discipline orientation strip, and prepared HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md appendix. Not bare HelpTopicMarkdownView. Sibling identity-providers settings; HOE = users-and-roles; COR = first-architecture-review. Score 58/100 (2026-08-05) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpEnterpriseOnboardingGuideView", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Glossary help. Owner backlog shorthand: HGE (template formerly HEG at lower Hit%). */
  {
    rowId: "HGE",
    path: "/help/glossary",
    section: "Help topic",
    note: "Glossary help (Help topic) - HelpGlossaryPageView with PageContextualHelpButton (topic map glossary; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, searchable term browser. Not bare HelpTopicMarkdownView. Score 58/100 (2026-08-04) Ã¢â‚¬â€ help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpGlossaryPageView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Getting started help. Owner backlog shorthand: HGX. */
  {
    rowId: "HGX",
    path: GETTING_STARTED_HELP_PATH,
    section: "Help topic",
    note: "Getting started help (Help topic) - HelpGettingStartedGuideView with PageContextualHelpButton (topic map getting-started; Category-1 registry), Learn more / claim-discipline orientation (Sources follow-up removed TB-2092), quick-start CTAs, workflow stepper, vocabulary. Absorbs former how-it-works twin (alias retired, TB-2050). Orientation guide - not a signed-record Sources trail. Score 58/100 (2026-08-08) - featured help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpGettingStartedGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Pilot guide help. Owner backlog shorthand: HP. */
  {
    rowId: "HP",
    path: "/help/pilot-guide",
    section: "Help topic",
    note: "Pilot guide help (Help topic) - HelpPilotGuideView with PageContextualHelpButton (topic map pilot-guide; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), pilot workflow CTAs, prepared pilot guide body. Absorbs retired pilot-nav-profile twin (PIL folded into HP, TB-1721). Orientation guide - not a signed-record Sources trail. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpPilotGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Pilot feedback help. Owner backlog shorthand: HPE. */
  {
    rowId: "HPE",
    path: "/help/pilot-feedback",
    section: "Help topic",
    note: "Pilot feedback help (Help topic) - HelpPilotFeedbackGuideView with PageContextualHelpButton (topic map pilot-feedback; Category-1 registry), claim-discipline orientation strip, Open Pilot feedback CTA, workflow stepper, job-matrix IA dual, curated PRODUCT_LEARNING.md (TB-1717 leakage strip). Sibling INR = live /internal/product-learning; INE = recommendation-learning; PLA = improvement planning. Not bare HelpTopicMarkdownView without orientation. Score 58/100 (2026-08-07) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Prior manifest retrieval help. Owner backlog shorthand: HPR. */
  {
    rowId: "HPR",
    path: "/help/prior-manifest-retrieval",
    section: "Help topic",
    note: "Prior manifest retrieval help (Help topic) - HelpTopicMarkdownView with PageContextualHelp +, curated PRIOR_MANIFEST_RETRIEVAL_GUIDE.md (TB-1733 host-config strip). Sibling ISE = search; INS = Ask; SI = sealed records. Not bare catch-all help chrome. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Choose your next step help. Owner backlog shorthand: HPX. */
  {
    rowId: "HPX",
    path: PATH_CHOOSER_HELP_PATH,
    section: "Help topic",
    note: "Path chooser help (Help topic) - HelpPathChooserGuideView with PageContextualHelpButton (topic map path-chooser; Category-1 registry), Start review CTA, four-step evaluator session strip, goal-branch primary/alternate CTAs (reviews/new, security-trust, first-architecture-review, sponsor-report, CLI), collapsed buyer-orientation reference appendix, related next steps card (TB-1345/TB-1349; TB-1712 leakage strip). Sibling HEE = evaluator-workbook alias; HAX = accelerator-chooser. Not bare HelpTopicMarkdownView. Score 64/100 (2026-08-10) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail.",
    noteMustContain: ["HelpPathChooserGuideView", "related next steps card", "Score 64"],
    sectionMustNotEqualLower: ["marketing"],
  },
  /** Traffic workbook row ID for Review guide help. Owner backlog shorthand: HR. */
  {
    rowId: "HR",
    path: "/help/review-guide",
    section: "Help topic",
    note: "Review guide help (Help topic) - HelpReviewGuideView with PageContextualHelpButton (topic map review-guide; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), start-review CTAs, prepared REVIEW_GUIDE.md body. Canon for wizard field-reference; absorbs former creating-runs / starting-reviews aliases via permanent redirect (TB-1258). Not bare HelpTopicMarkdownView. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.; 2026-08-11 al-ui-rate: Duplicate starting-reviews registry slug split traffic from review-guide; shipped TB-1258 (batch 21–24); open: TB-1259–TB-1262 Done",
    noteMustContain: ["HelpReviewGuideView", "TB-1258", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Report a problem help. Owner backlog shorthand: HRE. */
  {
    rowId: "HRE",
    path: "/help/report-a-problem",
    section: "Help topic",
    note: "Report a problem help (Help topic) - HelpTopicMarkdownView with PageContextualHelp +, curated REPORT_A_PROBLEM.md (support overclaim guard). Sibling HTX = troubleshooting; HDX = engineering troubleshooting; ASX = support workspace. Not bare catch-all help chrome. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Repeat-review loop help. Owner backlog shorthand: HRX. */
  {
    rowId: "HRX",
    path: "/help/repeat-review-loop",
    section: "Help topic",
    note: "Repeat-review loop help (Help topic) - HelpRepeatReviewLoopGuideView with PageContextualHelpButton (topic map repeat-review-loop; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, start-loop CTAs, prepared SECOND_RUN / REPEAT_REVIEW_LOOP markdown. Sibling CXX = compare-two-reviews; REP = /internal/validate-route; COR = first-architecture-review. Score 58/100 (2026-08-05) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpRepeatReviewLoopGuideView", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Specialty walkthroughs help. Owner backlog shorthand: HS. */
  {
    rowId: "HS",
    path: "/help/specialty-walkthroughs",
    section: "Help topic",
    note: "Specialty walkthroughs help (Help topic) - HelpSpecialtyWalkthroughTemplatesView with PageContextualHelp +, template catalog CTAs into Start review. Sibling RNX = reviews/new; HPX = path-chooser; COR = first-architecture-review. Not bare catch-all help chrome. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Workspace and scope guide help. Owner backlog shorthand: HSX. */
  {
    rowId: "HSX",
    path: "/help/scope",
    section: "Help topic",
    note: "Workspace and scope help (Help topic) - HelpTopicMarkdownView with PageContextualHelpButton (topic map scope; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, curated WORKSPACE_SCOPE_GUIDE markdown. Sibling HOE = users-and-roles. Score 58/100 (2026-08-05) Ã¢â‚¬â€ help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpTopicMarkdownView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Troubleshooting help. Owner backlog shorthand: HTX. */
  {
    rowId: "HTX",
    path: "/help/troubleshooting",
    section: "Help topic",
    note: "Troubleshooting help (Help topic) - HelpTroubleshootingGuideView with PageContextualHelpButton (topic map troubleshooting; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), start-here CTAs, common issues, advanced diagnostics. Operator unblocking guide - not a signed-record Sources trail. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpTroubleshootingGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Pilot outcomes help topic. Owner backlog shorthand: HPO. */
  {
    rowId: "HPO",
    path: "/help/pilot-outcomes",
    section: "Help topic",
    note: "Pilot outcomes help (Help topic) - HelpPilotOutcomesGuideView with PageContextualHelpButton (topic map pilot-outcomes; Category-1 registry), outcomes orientation strip, pilot value report CTAs. Sibling SPP = /insights/pilot-outcomes. Not bare HelpTopicMarkdownView. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpPilotOutcomesGuideView", "Score 58", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for ROI summary help. Owner backlog shorthand: HRO. */
  {
    rowId: "HRO",
    path: "/help/roi-summary",
    section: "Help topic",
    note: "ROI summary help (Help topic) - HelpRoiSummaryGuideView with PageContextualHelpButton (topic map roi-summary; Category-1 registry), directional ROI orientation strip, executive summary and scorecard sibling links. Sibling SPR = /insights/roi-summary. Not bare HelpTopicMarkdownView. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpRoiSummaryGuideView", "Score 58", "cannot improve further toward 80"],
  },
];
