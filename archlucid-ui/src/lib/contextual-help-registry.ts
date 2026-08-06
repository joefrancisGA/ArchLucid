/**
 * Page-scoped context-sensitive help (Category 1 IA taxonomy) — short answers to up to four
 * questions per operator route. Long-form guides remain on `/help/{slug}` via `page-help-topic-map.ts`.
 */

import {
  DIGESTS_HUB_PATH,
  DIGESTS_SCHEDULE_TAB_PATH,
  LEGACY_DIGESTS_HUB_PATH,
  LEGACY_DIGEST_SUBSCRIPTIONS_PATH,
} from "@/lib/digests-route-paths";
import {
  LEGACY_SETTINGS_ROLES_PATH,
} from "@/lib/settings-admin-route-paths";
import {
  PROVENANCE_CONTEXTUAL_HELP,
  pathIsRunProvenance,
} from "@/lib/provenance-evidence-copy";

/** Optional in-app deep link for a Category-1 field (TB-2049 Digests golden / TB-2051). */
export type PageContextualHelpAction = {
  readonly label: string;
  readonly href: string;
};

export type PageContextualHelpEntry = {
  readonly whatIsThisPage: string;
  readonly whatToDoNext: string;
  readonly whyEmpty?: string;
  readonly whereToConfigurePrerequisite?: string;
  readonly whatToDoNextAction?: PageContextualHelpAction;
  readonly whereToConfigureAction?: PageContextualHelpAction;
};

type PageContextualHelpRow = {
  readonly prefix: string;
  readonly entry: PageContextualHelpEntry;
};

const DIGESTS_HUB_CONTEXTUAL_HELP: PageContextualHelpEntry = {
  whatIsThisPage:
    "Send scheduled summaries of review activity, governance signals, findings, and advisory scans.",
  whatToDoNext: "Open the Schedule tab to set timing and recipients, then preview or send a test digest.",
  whyEmpty: "Generated digests appear here after a schedule and recipients are configured.",
  whereToConfigurePrerequisite:
    "Recipient subscriptions and executive rollup settings live on the Schedule tab.",
  whatToDoNextAction: {
    label: "Open Schedule tab",
    href: DIGESTS_SCHEDULE_TAB_PATH,
  },
  whereToConfigureAction: {
    label: "Open Schedule tab",
    href: DIGESTS_SCHEDULE_TAB_PATH,
  },
};

const PAGE_CONTEXTUAL_HELP: readonly PageContextualHelpRow[] = [
  {
    // Exact `/` only — matcher uses path === prefix; startsWith(`${prefix}/`) is `//` and does not steal other routes.
    prefix: "/",
    entry: {
      whatIsThisPage:
        "Workspace Overview — start or resume architecture reviews and see recent activity from one command center.",
      whatToDoNext: "Start a review, resume a draft, or explore a sample package from the hero actions.",
      whyEmpty: "Recent reviews and metrics appear after you create or finalize architecture reviews.",
      whereToConfigurePrerequisite: "Switch workspace or project scope from the header switcher when you work across teams.",
    },
  },
  {
    prefix: "/architecture/reviews",
    entry: {
      whatIsThisPage: "Create, refine, evaluate, and approve architecture reviews from one hub.",
      whatToDoNext: "Start a review, resume a draft, or explore a sample workspace.",
      whyEmpty: "Summary metrics populate after you start or finalize architecture reviews.",
      whereToConfigurePrerequisite: "Switch workspace or project scope from the header switcher.",
    },
  },
  {
    prefix: "/insights/architecture-scorecard",
    entry: {
      whatIsThisPage:
        "Architecture scorecard — workspace throughput tiles and a directional review-time savings model for pilot discussions.",
      whatToDoNext:
        "Finalize reviews to populate tiles, then tune ROI assumptions or open ROI summary for sponsor exports.",
      whyEmpty: "Tiles stay empty until you finalize architecture reviews in this workspace.",
      whereToConfigurePrerequisite:
        "Save ROI assumptions on this page when you have Execute authority, or use workspace baseline settings.",
    },
  },
  {
    prefix: "/governance/dashboard",
    entry: {
      whatIsThisPage:
        "Workspace health at a glance — scoped KPI tiles for pre-commit posture, findings exposure, drift, approval SLAs, and a hours estimate.",
      whatToDoNext:
        "Open Decisions needed items, then use Audit trail or Findings for row-level follow-up before sponsor briefings.",
      whyEmpty: "Tiles stay at zero until governance and audit activity exists in the current workspace scope.",
      whereToConfigurePrerequisite:
        "Switch workspace or project scope from the header switcher — figures never roll up across workspaces.",
    },
  },
  {
    prefix: "/governance/findings",
    entry: {
      whatIsThisPage:
        "Track architecture risks from accepted findings, waivers, exceptions, and governance decisions.",
      whatToDoNext: "Assign owners, review aging risks, and clear expiring exceptions.",
      whyEmpty: "Rows appear after findings are accepted or governance decisions are recorded in reviews.",
      whereToConfigurePrerequisite:
        "Policy packs and governance workflow settings shape what becomes a tracked risk.",
    },
  },
  {
    prefix: "/insights/ask-review-questions",
    entry: {
      whatIsThisPage:
        "Ask plain-language questions about a finalized review; answers use the signed record and cite findings when available.",
      whatToDoNext:
        "Select a review, ask about risk or evidence, then open cited findings or the evidence trail under the answer.",
      whyEmpty: "Threads appear after you ask a question against a selected review.",
      whereToConfigurePrerequisite: "Finalize or open a review so Ask can ground answers in its evidence.",
    },
  },
  {
    prefix: "/insights/compare-two-reviews",
    entry: {
      whatIsThisPage:
        "Compare two finalized reviews to see what changed in scope, findings, decisions, governance, and evidence.",
      whatToDoNext:
        "Pick baseline and updated reviews, run Compare, then open Sources for each side before briefing sponsors.",
      whyEmpty: "Results appear after you compare two finalized reviews.",
      whereToConfigurePrerequisite: "Finalize at least two reviews in this workspace first.",
    },
  },
  {
    prefix: "/replay",
    entry: {
      whatIsThisPage:
        "Validate review — re-check a finalized review package (reconstruct, rebuild outputs, or full regeneration).",
      whatToDoNext:
        "Pick a finalized review, choose a validation depth, run the check, then open the review or Compare when you need diffs.",
      whyEmpty: "Validation results appear after you run a check on a selected review package.",
      whereToConfigurePrerequisite: "Finalize at least one review in this workspace first; Admin Execute access may be required.",
    },
  },
  {
    prefix: "/insights/search-review-evidence",
    entry: {
      whatIsThisPage:
        "Search findings, decisions, and signed review evidence across the workspace index, optionally scoped to one review.",
      whatToDoNext:
        "Enter a phrase, optionally limit to a review, then open the hit, Evidence trail, or Sources cites before briefing.",
      whyEmpty: "Matches appear after committed review evidence is indexed and your query finds relevant chunks.",
      whereToConfigurePrerequisite: "Finalize reviews so findings and signed records are available to search.",
    },
  },
  {
    prefix: "/help/data-handling-tenant-isolation",
    entry: {
      whatIsThisPage:
        "Explain how review evidence is handled, what stays in your tenant, and how three-layer isolation works.",
      whatToDoNext:
        "Open Trust Center or Assurance status for diligence artifacts, then review Sources before sponsor briefings.",
      whyEmpty: "This guide always shows isolation and data-handling content when the help topic loads.",
      whereToConfigurePrerequisite: "Confirm residency and subprocessors during procurement with your account team.",
    },
  },
  {
    prefix: "/help/dpa-template",
    entry: {
      whatIsThisPage:
        "Working Data Processing Agreement negotiation template for counsel — not a countersigned DPA.",
      whatToDoNext:
        "Open Trust Center for the diligence pack, review Subprocessors, then expand the full template with counsel.",
      whyEmpty: "Orientation and CTAs always appear when this help topic loads; expand the disclosure for clauses.",
      whereToConfigurePrerequisite: "Execute a DPA only through your procurement counsel and account team.",
    },
  },
  {
    prefix: "/help/soc2-self-assessment",
    entry: {
      whatIsThisPage:
        "Owner SOC 2 Trust Services Criteria self-assessment — not a CPA Type I or Type II attestation.",
      whatToDoNext:
        "Open Trust Center for the diligence pack, use CAIQ/SIG for questionnaires, then read the control summary as readiness mapping only.",
      whyEmpty: "Orientation and CTAs always appear when this help topic loads.",
      whereToConfigurePrerequisite:
        "CPA attestation and third-party pen-test publication remain owner programs outside this page.",
    },
  },
  {
    prefix: "/help/path-chooser",
    entry: {
      whatIsThisPage:
        "Map your current goal to one primary next action for evaluate, pilot, procurement, sponsor, or engineering support.",
      whatToDoNext:
        "Pick the matching goal branch, open the primary cite, then use Sources before treating orientation as diligence.",
      whyEmpty: "Branches always appear when this help topic loads.",
      whereToConfigurePrerequisite: "Start or finalize a review when your goal needs product evidence, not just orientation.",
    },
  },
  {
    prefix: "/help/evaluator-workbook",
    entry: {
      whatIsThisPage:
        "Map your current goal to one primary next action for evaluate, pilot, procurement, sponsor, or engineering support.",
      whatToDoNext:
        "Pick the matching goal branch, open the primary cite, then use Sources before treating orientation as diligence.",
      whyEmpty: "Branches always appear when this help topic loads.",
      whereToConfigurePrerequisite: "Start or finalize a review when your goal needs product evidence, not just orientation.",
    },
  },
  {
    prefix: "/help/enterprise-onboarding",
    entry: {
      whatIsThisPage:
        "Enterprise onboarding checklist - configure SSO, roles, governance, policy packs, audit export, and optional Azure evidence for a hosted tenant.",
      whatToDoNext:
        "Open Identity providers for SSO, Users and roles for access, then Assurance status for assurance orientation.",
      whyEmpty: "This guide is always available; live identity and role surfaces appear after workspace configuration.",
      whereToConfigurePrerequisite:
        "SSO and role changes need System Admin authority in the current workspace.",
    },
  },
  {
    prefix: "/help/pilot-roi-model",
    entry: {
      whatIsThisPage:
        "Pilot ROI model - how sponsor ROI figures are labeled, sourced, and kept buyer-safe in proof packets.",
      whatToDoNext:
        "Open Architecture scorecard or ROI summary for live numbers, or Workspace baseline when anchors need capture.",
      whyEmpty: "This guide is always available; scorecard and baseline surfaces populate after reviews and tenant setup.",
      whereToConfigurePrerequisite:
        "Baseline and scorecard numbers need a role that can read tenant settings and finalized reviews.",
    },
  },
  {
    prefix: "/help/policy-pack-delta-demo",
    entry: {
      whatIsThisPage:
        "SE and Admin demo script showing how stricter policy-pack enforcement changes finalize-gate outcomes on one review.",
      whatToDoNext:
        "Open policy packs, run the dry-run arc, then cite the audit trail before treating simulation as certification.",
      whyEmpty: "This runbook always shows the demo arc when the help topic loads.",
      whereToConfigurePrerequisite: "Use a committed review with findings and Admin access to policy packs and audit export.",
    },
  },
  {
    prefix: "/help/configuration-reference",
    entry: {
      whatIsThisPage:
        "Admin configuration task guide for SSO, identity providers, API keys, and production-like hosting posture.",
      whatToDoNext:
        "Open the matching settings CTA (SSO, identity providers, or API keys), then expand the key catalog appendix only if needed.",
      whyEmpty: "This guide always shows configuration tasks when the help topic loads.",
      whereToConfigurePrerequisite: "Admin access to identity settings, API keys, and the configuration summary.",
    },
  },
  {
    prefix: "/help/cli-usage",
    entry: {
      whatIsThisPage:
        "CLI usage engineering runbook — non-interactive archlucid commands, environment variables, exit codes, and API starter fixtures.",
      whatToDoNext:
        "Prefer customer Troubleshooting and System health first, then use CLI detail; open engineering troubleshooting when logs need deeper triage.",
      whyEmpty: "This reference always shows when the help topic loads.",
      whereToConfigurePrerequisite:
        "CLI and API automation need credentials and workspace scope configured for the target environment.",
    },
  },
  {
    prefix: "/help/first-review",
    entry: {
      whatIsThisPage:
        "Admin and SE printable first-run evidence checklist for Azure extractor Tier 1, finalize, and sponsor-packet proof.",
      whatToDoNext:
        "Send customer architects to Your first architecture review, start a demo review when ready, then cite the audit trail.",
      whyEmpty: "This checklist always shows when the help topic loads.",
      whereToConfigurePrerequisite: "Admin access plus a workspace that can run extractor ingest and finalize.",
    },
  },
  {
    prefix: "/help/first-value-20-minutes",
    entry: {
      whatIsThisPage:
        "Admin SE time-boxed checklist for first value in about 20 minutes when platform wiring is already green.",
      whatToDoNext:
        "Send customers to Your first architecture review; use this runbook only for Admin SE proof collection.",
      whyEmpty: "Orientation and the 20-minute checklist always show when this Admin help topic loads.",
      whereToConfigurePrerequisite: "Admin access with healthy API and persistence before starting the time box.",
    },
  },
  {
    prefix: "/help/developer-troubleshooting",
    entry: {
      whatIsThisPage:
        "Admin engineering troubleshooting runbook for CLI, environment, and log triage after customer Troubleshooting.",
      whatToDoNext:
        "Prefer Customer Troubleshooting and System health first, then use eng CLI/env detail; open Report a problem when filing a ticket.",
      whyEmpty: "This runbook always shows when the help topic loads for Admins.",
      whereToConfigurePrerequisite: "Admin access; Operators should use the customer Troubleshooting guide instead.",
    },
  },
  {
    prefix: "/help/governance-api-contracts",
    entry: {
      whatIsThisPage:
        "Admin HTTP and OpenAPI contract reference for integrators — not the buyer Governance approval FAQ.",
      whatToDoNext:
        "Open CLI usage or Configuration reference for tooling, or Governance approval if you need buyer approval workflows.",
      whyEmpty: "Orientation and stripped contract reference always show when this Admin help topic loads.",
      whereToConfigurePrerequisite: "Admin access; treat OpenAPI as the contract of record when prose disagrees.",
    },
  },
  {
    prefix: "/governance/standards-and-rules",
    entry: {
      whatIsThisPage:
        "Inspect standards and policy rules applied to a review, including enforcement mode, source pack, and linked evidence.",
      whatToDoNext:
        "Open linked findings or the evidence trail for a rule, then export a resolution snapshot when you need a citeable record.",
      whyEmpty: "Rules appear after a policy pack or governance configuration applies checks to a review.",
      whereToConfigurePrerequisite: "Assign and order policy packs for the current workspace and project scope.",
    },
  },
  {
    prefix: "/governance/policy-packs",
    entry: {
      whatIsThisPage:
        "Review policy pack rules, versions, and how packs apply to architecture reviews in this workspace.",
      whatToDoNext:
        "Open a pack to inspect rules, return to the library to compare packs, or apply a pack when starting a review.",
      whyEmpty: "Packs appear after the library is populated for this workspace.",
      whereToConfigurePrerequisite:
        "Policy packs respect the workspace and project selected in the header switcher.",
    },
  },
  {
    prefix: "/governance/decision-register",
    entry: {
      whatIsThisPage:
        "Browse architecture decisions locked with signed review records — category, confidence, findings, and lineage.",
      whatToDoNext:
        "Filter by date or category, open a decision card, then follow the linked review or findings when needed.",
      whyEmpty: "Decisions appear after reviews are signed with recorded architecture decisions.",
      whereToConfigurePrerequisite:
        "Decision register respects the workspace and project selected in the header switcher.",
    },
  },
  {
    prefix: "/reviews/new",
    entry: {
      whatIsThisPage:
        "Start an architecture review by choosing an intake path and submitting evidence for analysis.",
      whatToDoNext:
        "Pick quick, guided, or detailed intake, complete the required fields, then submit to create the review.",
      whyEmpty: "Path choices appear immediately; review results appear after you submit intake.",
      whereToConfigurePrerequisite:
        "Reviews use the workspace and project selected in the header switcher.",
    },
  },
  {
    prefix: "/architecture/reviews/new",
    entry: {
      whatIsThisPage:
        "Start an architecture review by choosing an intake path and submitting evidence for analysis.",
      whatToDoNext:
        "Pick quick, guided, or detailed intake, complete the required fields, then submit to create the review.",
      whyEmpty: "Path choices appear immediately; review results appear after you submit intake.",
      whereToConfigurePrerequisite:
        "Reviews use the workspace and project selected in the header switcher.",
    },
  },
  {
    prefix: "/governance/audit",
    entry: {
      whatIsThisPage:
        "Search and export operator audit events for reviews, governance actions, and integrity checks in this workspace.",
      whatToDoNext:
        "Filter by review or action, refresh the trail, then export or open the related review package when needed.",
      whyEmpty: "Events appear after operators take actions that the audit coverage matrix records.",
      whereToConfigurePrerequisite:
        "Audit retention and export privileges follow workspace role and enterprise controls.",
    },
  },
  {
    prefix: "/administration/system-health",
    entry: {
      whatIsThisPage:
        "Confirm workspace service health, required dependencies, and deployment identity for this tenant.",
      whatToDoNext:
        "Refresh readiness, then open Connection status when a dependency needs follow-up.",
      whyEmpty: "Health rows appear after the readiness probe returns for this workspace.",
      whereToConfigurePrerequisite:
        "Dependency connectivity is configured under Administration → Connection status.",
      whatToDoNextAction: {
        label: "Open Connection status",
        href: "/administration/connection-status",
      },
      whereToConfigureAction: {
        label: "Open Connection status",
        href: "/administration/connection-status",
      },
    },
  },
  {
    prefix: "/administration/connection-status",
    entry: {
      whatIsThisPage:
        "Connection status - see which notification, ticketing, publishing, and delivery integrations are ready, recommended, or optional for this workspace.",
      whatToDoNext:
        "Open a connector that needs configuration, or System health when dependency checks need follow-up.",
      whyEmpty:
        "Readiness tiles appear after connector probes load; optional connectors stay listed until configured.",
      whereToConfigurePrerequisite:
        "Configuring connectors needs a role that can manage workspace integrations.",
    },
  },
  {
    prefix: DIGESTS_HUB_PATH,
    entry: DIGESTS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: LEGACY_DIGESTS_HUB_PATH,
    entry: DIGESTS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: LEGACY_DIGEST_SUBSCRIPTIONS_PATH,
    entry: DIGESTS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: "/help/digests",
    entry: {
      whatIsThisPage:
        "Architecture digests — how scheduled operator summaries are configured, delivered, and browsed.",
      whatToDoNext: "Open the Digests hub Schedule tab to set cadence and recipients, then manage subscriptions.",
      whyEmpty: "This guide is always available; generated digests appear after schedule and recipients are configured.",
      whereToConfigurePrerequisite:
        "Cadence and recipients live on Digests Schedule; destinations live on Subscriptions.",
      whatToDoNextAction: {
        label: "Open Schedule tab",
        href: DIGESTS_SCHEDULE_TAB_PATH,
      },
    },
  },
  {
    prefix: "/insights/planning/plans",
    entry: {
      whatIsThisPage:
        "Review one prioritized improvement plan derived from captured feedback, including status and linked themes.",
      whatToDoNext:
        "Return to Improvement planning for peer plans, or open reviews and findings when this plan needs follow-up.",
      whyEmpty: "Plan detail appears after a plan is generated from captured feedback.",
      whereToConfigurePrerequisite:
        "Plans respect the workspace and project selected in the header switcher.",
    },
  },
  {
    prefix: "/insights/planning",
    entry: {
      whatIsThisPage:
        "Convert review feedback into recurring themes, prioritized improvement plans, and exportable summaries.",
      whatToDoNext: "Capture review feedback or run pilot feedback analysis to generate themes and plans.",
      whyEmpty: "Themes and plans appear after feedback is captured and analyzed.",
      whereToConfigurePrerequisite:
        "Planning insights respect the workspace and project selected in the header switcher.",
    },
  },
  {
    // TB-2050 — Learn more omitted (no specialty); Category-1 still mounts.
    prefix: "/insights/impact-preview",
    entry: {
      whatIsThisPage:
        "Estimate before-and-after effects of proposed architecture changes against a finalized review baseline.",
      whatToDoNext: "Select a finalized review baseline, set comparison scope, then run the impact preview.",
      whyEmpty: "Preview results appear after you choose a baseline review and run a simulation.",
      whereToConfigurePrerequisite:
        "Impact preview needs at least one finalized architecture review in this workspace.",
    },
  },
  {
    prefix: "/internal/product-learning",
    entry: {
      whatIsThisPage:
        "Pilot feedback — aggregate review signals, ranked improvement opportunities, and exports for product triage.",
      whatToDoNext:
        "Filter by time range, open Improvement planning for themes and plans, or start a review when the dataset is empty.",
      whyEmpty: "Feedback rows appear after operators capture review outcomes in this workspace.",
      whereToConfigurePrerequisite:
        "Pilot feedback is an Internal Ops surface — System Admin authority is typically required.",
    },
  },
  {
    prefix: "/why-archlucid",
    entry: {
      whatIsThisPage:
        "Why ArchLucid — operator demo/proof page with seeded telemetry, sponsor pack, and first-value report for the demo review.",
      whatToDoNext:
        "Inspect snapshot and sponsor pack sections, open marketing /why for buyer comparison, or Assurance status for assurance orientation.",
      whyEmpty: "Sections populate after the demo tenant snapshot and related read endpoints load.",
      whereToConfigurePrerequisite:
        "A seeded demo review is required; Claims/Retail labels stay withheld until the demo identity is unambiguous.",
    },
  },
  {
    prefix: "/demo/explain",
    entry: {
      whatIsThisPage:
        "Demo explain — example provenance graph and citations-bound explanation for a seeded architecture review.",
      whatToDoNext:
        "Inspect the provenance and explanation panels, then start a real review or open Validate review for live packages.",
      whyEmpty: "Panels appear after the demo explain API returns a seeded review payload.",
      whereToConfigurePrerequisite:
        "A seeded demo tenant review is required; this route stays hidden from buyer nav when demo explain is unavailable.",
    },
  },
  {
    prefix: "/governance/advisory-scans",
    entry: {
      whatIsThisPage: "Generate prioritized follow-up recommendations from finalized reviews.",
      whatToDoNext: "Select a finalized review and generate a scan, or open Schedules for recurring runs.",
      whyEmpty: "Scans appear after you generate one from a finalized review.",
      whereToConfigurePrerequisite:
        "Finalize a review first; optional baseline comparison highlights drift.",
    },
  },
  {
    prefix: "/sponsor-report/executive-summary",
    entry: {
      whatIsThisPage:
        "Sponsor executive summary — period preview of finalized reviews, findings, governance activity, and directional ROI for exports.",
      whatToDoNext: "Set the report period, refresh the preview, then generate sponsor exports when data is ready.",
      whyEmpty: "The preview fills in after you finalize reviews in the selected period.",
      whereToConfigurePrerequisite: "ROI estimates use baseline settings from workspace configuration.",
    },
  },
  {
    prefix: "/sponsor-report/pilot-outcomes",
    entry: {
      whatIsThisPage:
        "Pilot outcomes — period summary of finalized review activity, material findings, governance decisions, and measurable pilot results.",
      whatToDoNext:
        "Set the reporting period, apply it, then open Executive summary or ROI summary when you need sibling sponsor packaging.",
      whyEmpty: "Outcomes fill in after you finalize architecture reviews in the selected period.",
      whereToConfigurePrerequisite:
        "Report windows use the current tenant, workspace, and project selected in the shell header.",
    },
  },
  {
    prefix: "/executive/scorecard",
    entry: {
      whatIsThisPage:
        "Sponsor scorecard — key value metrics for completed reviews, findings pressure, and directional hours in the selected window.",
      whatToDoNext:
        "Pick a time range, review recommended actions, then open Architecture reviews or Sponsor executive summary for follow-up.",
      whyEmpty: "KPIs stay empty until you finalize architecture reviews in this workspace scope.",
      whereToConfigurePrerequisite:
        "Scorecard windows use the current tenant, workspace, and project selected in the shell header.",
    },
  },
  {
    prefix: "/governance/alert-rules",
    entry: {
      whatIsThisPage:
        "Configure when completed reviews raise alerts, where notifications are delivered, advanced composite rules, and simulation tests.",
      whatToDoNext:
        "Set Conditions first, then open Notifications to add destinations, or use Test alerts to simulate behavior.",
      whyEmpty: "Rules and destinations appear after you create them for this workspace.",
      whereToConfigurePrerequisite:
        "Alert delivery often needs channel integrations (email, Teams, Slack, or webhooks) configured under Integrations.",
    },
  },
  {
    prefix: "/governance/approval-requests",
    entry: {
      whatIsThisPage:
        "Approval lineage — inspect how an approval request links to its review, findings, risk posture, and signed-record version.",
      whatToDoNext:
        "Open the linked review or findings, return to the approval queue, or check Audit when you need the activity trail.",
      whyEmpty: "Lineage appears after an approval request exists for a finalized review package.",
      whereToConfigurePrerequisite:
        "Submit or open an approval from the governance approval queue after a review is ready for decision.",
    },
  },
  {
    prefix: "/governance/signed-records",
    entry: {
      whatIsThisPage:
        "Signed review record — the finalized package of decisions, findings, and downloadable artifacts for one architecture review.",
      whatToDoNext:
        "Review the summary and decisions, open related findings, or export the review bundle when downloads are ready.",
      whyEmpty: "A signed review record appears after you finalize an architecture review package.",
      whereToConfigurePrerequisite:
        "Finalize a review from the architecture review workspace before opening its signed record.",
    },
  },
  {
    prefix: "/admin/tenant-health",
    entry: {
      whatIsThisPage:
        "Tenant health — internal customer-success scores for engagement, governance activity, and pilot funnel stage by tenant scope.",
      whatToDoNext:
        "Refresh the table, sort attention to low engagement rows, then open System health or Audit when a tenant needs follow-up.",
      whyEmpty: "Rows appear after tenant scopes have recorded review or governance activity.",
      whereToConfigurePrerequisite:
        "This page requires tenant administrator access; customer tenants never see other tenants here.",
    },
  },
  {
    prefix: "/admin/trial-funnel",
    entry: {
      whatIsThisPage:
        "Trial funnel — internal conversion KPIs and cohort rows for trial-stage progress across tenants.",
      whatToDoNext:
        "Adjust the date range, refresh, then open Tenant health or Billing when a cohort needs follow-up.",
      whyEmpty: "Cohort rows appear after trial tenants record signup and review activity in the selected period.",
      whereToConfigurePrerequisite:
        "This page requires tenant administrator access; customer tenants never see other tenants here.",
    },
  },
  {
    prefix: "/admin/demo-readiness",
    entry: {
      whatIsThisPage:
        "Demo readiness - internal employee diagnostic checklist for buyer CTO demo preflight across this workspace.",
      whatToDoNext:
        "Run the readiness checks, open System health when a dependency fails, or Trial funnel when conversion context is needed.",
      whyEmpty: "Checklist rows appear after the internal readiness probe returns for this deployment.",
      whereToConfigurePrerequisite:
        "This page requires tenant administrator access; customer tenants never see this diagnostic.",
    },
  },
  {
    prefix: "/admin/deployment-status",
    entry: {
      whatIsThisPage:
        "Deployment status - internal release identity, health, and BUILD_ID agreement across frontend, API, and worker.",
      whatToDoNext:
        "Refresh status, open System health when readiness fails, or Diagnostics dashboard for deeper platform probes.",
      whyEmpty: "Identity fields appear after the admin deployment-status probe returns for this environment.",
      whereToConfigurePrerequisite:
        "This page requires ArchLucid personnel access; customer tenants never see deployment identity here.",
    },
  },
  {
    prefix: "/help/getting-started",
    entry: {
      whatIsThisPage:
        "Getting started guide — how ArchLucid turns evidence into findings, decisions, and governance-ready review outputs.",
      whatToDoNext:
        "Start a review, open the sample walkthrough, or pick a path from Choose your next step when you know your goal.",
      whyEmpty: "This guide is always available; review metrics appear after you create or finalize reviews.",
      whereToConfigurePrerequisite:
        "Choose a workspace in the header scope switcher before starting a real (non-sample) review.",
    },
  },
  {
    // Alias URL still reachable; canon topic is getting-started (how-it-works fold).
    prefix: "/help/how-it-works",
    entry: {
      whatIsThisPage:
        "Getting started — how ArchLucid turns evidence into findings, decisions, and governance-ready review outputs (includes How ArchLucid works).",
      whatToDoNext:
        "Start a review, open the sample walkthrough, or pick a path from Choose your next step when you know your goal.",
      whyEmpty: "This guide is always available; review metrics appear after you create or finalize reviews.",
      whereToConfigurePrerequisite:
        "Choose a workspace in the header scope switcher before starting a real (non-sample) review.",
    },
  },
  {
    prefix: "/help/troubleshooting",
    entry: {
      whatIsThisPage:
        "Troubleshooting — symptom-first guidance to unblock reviews, connections, and operator workflows.",
      whatToDoNext:
        "Start with System health, download a support bundle when needed, then open the matching common-issue card.",
      whyEmpty: "This guide is always available; live dependency status appears on System health.",
      whereToConfigurePrerequisite:
        "Confirm workspace scope in the header switcher before diagnosing tenant-specific failures.",
    },
  },
  {
    prefix: "/help/alerts",
    entry: {
      whatIsThisPage:
        "How alerts work — how ArchLucid raises, routes, and resolves governance notifications for operators.",
      whatToDoNext:
        "Open the alerts inbox or Alert rules, then confirm destinations and conditions for this workspace.",
      whyEmpty: "This guide is always available; live inbox and rules appear after reviews raise alerts.",
      whereToConfigurePrerequisite:
        "Alert delivery often needs channel integrations configured under Integrations.",
    },
  },
  {
    prefix: "/help/billing-and-plans",
    entry: {
      whatIsThisPage:
        "Billing and plans — how evaluation and paid plans, usage, and invoices show up for operators.",
      whatToDoNext:
        "Open Billing settings for this workspace, or Pricing when you need public packaging before changing plans.",
      whyEmpty: "This guide is always available; live plan and usage cards appear after billing data loads.",
      whereToConfigurePrerequisite:
        "Changing plans or payment methods needs a role that can manage workspace billing.",
    },
  },
  {
    prefix: "/help/security-trust",
    entry: {
      whatIsThisPage:
        "Security and trust help — assurance ladder, data handling, subprocessors, and diligence materials for operators and buyers.",
      whatToDoNext:
        "Open Assurance status or Trust Center for live assurance surfaces, or Audit when you need governed trails.",
      whyEmpty: "This guide is always available; downloadable diligence packs appear on Trust Center when published.",
      whereToConfigurePrerequisite:
        "No configuration is required — this page is assurance orientation vocabulary only.",
    },
  },
  {
    prefix: "/help/procurement",
    entry: {
      whatIsThisPage:
        "Procurement FAQ — buyer-facing answers on diligence packs, questionnaires, and how to request security review materials.",
      whatToDoNext:
        "Open Assurance status or Trust Center for public assurance, or settings Security & trust when requesting NDA-gated packs.",
      whyEmpty: "This FAQ is always available; NDA packs require contacting the security mailbox listed in the guide.",
      whereToConfigurePrerequisite:
        "No workspace toggle is required — this page is procurement orientation vocabulary only.",
    },
  },
  {
    prefix: "/help/scope",
    entry: {
      whatIsThisPage:
        "Workspace and scope guide — how tenant, workspace, and project boundaries work with the header switcher.",
      whatToDoNext:
        "Confirm the header scope switcher, then open Users and roles or Users settings when access needs adjustment.",
      whyEmpty: "This guide is always available; live scope labels appear in the operator header after sign-in.",
      whereToConfigurePrerequisite:
        "Changing tenant or project membership needs Admin authority in the target workspace.",
    },
  },
  {
    prefix: "/help/audit-trail",
    entry: {
      whatIsThisPage:
        "Audit trail help — how immutable audit events, correlation identifiers, and export posture support governed review.",
      whatToDoNext:
        "Open Audit for live activity, Findings when a concern needs triage, or Assurance status for assurance surfaces.",
      whyEmpty: "This guide is always available; live audit rows appear after workspace actions are recorded.",
      whereToConfigurePrerequisite:
        "Audit visibility follows workspace roles; confirm the header workspace before exporting trails.",
    },
  },
  {
    prefix: "/help/evidence-trail",
    entry: {
      whatIsThisPage:
        "Evidence graph guide — how to trace findings, artifacts, and provenance without exposing raw engineering logs.",
      whatToDoNext:
        "Open the live Evidence graph, Search review evidence, or Validate review when you need package-level trails.",
      whyEmpty: "This guide is always available; live graph nodes appear after finalized reviews exist.",
      whereToConfigurePrerequisite:
        "Evidence graph depth follows finalized reviews in the current workspace and project scope.",
    },
  },
  {
    prefix: "/help/evidence-intake",
    entry: {
      whatIsThisPage:
        "Start a review guide — how to begin from a brief, diagram, document, or cloud evidence and verify intake before finalize.",
      whatToDoNext:
        "Open New architecture review to start intake, or Your first architecture review when you need the guided walkthrough.",
      whyEmpty: "This guide is always available; live intake drafts appear after you create architecture reviews.",
      whereToConfigurePrerequisite:
        "Creating reviews needs a role that can start architecture reviews in this workspace.",
    },
  },
  {
    prefix: "/help/findings",
    entry: {
      whatIsThisPage:
        "Findings — how architecture concerns are inspected, severity-ranked, and moved through governance resolution.",
      whatToDoNext:
        "Open the findings queue, search supporting evidence, or check the decision register for related outcomes.",
      whyEmpty: "This guide is always available; live findings appear after reviews produce architecture concerns.",
      whereToConfigurePrerequisite:
        "Findings respect the workspace and project selected in the header switcher.",
    },
  },
  {
    prefix: "/help/governance-approval",
    entry: {
      whatIsThisPage:
        "Governance approval — how architecture decisions move through submit, review, and finalize for operators.",
      whatToDoNext:
        "Open the approval queue or Workspace Health, then use Findings when you need the risk register behind a decision.",
      whyEmpty: "This guide is always available; live approval queues appear after reviews enter governance.",
      whereToConfigurePrerequisite:
        "Approval authority follows workspace roles; confirm the header workspace before acting on requests.",
    },
  },
  {
    prefix: "/help/review-guide",
    entry: {
      whatIsThisPage:
        "Review guide — field reference for naming a review, uploading evidence, confirming scope, and finalizing the package.",
      whatToDoNext:
        "Start an architecture review, or open the First review guide when you need the walkthrough instead of field detail.",
      whyEmpty: "This guide is always available; live review packages appear after you create architecture reviews.",
      whereToConfigurePrerequisite:
        "Creating reviews needs a role that can start architecture reviews in this workspace.",
    },
  },
  {
    prefix: "/help/repeat-review-loop",
    entry: {
      whatIsThisPage:
        "Repeat-review loop - compare packages, replay authority, and collect second-review proof after the first finalized review.",
      whatToDoNext:
        "Open Compare two reviews, start the next review, or Validate review when you need live package trails.",
      whyEmpty: "This guide is always available; compare and replay surfaces populate after finalized reviews exist.",
      whereToConfigurePrerequisite:
        "Stickiness workflows need at least one finalized architecture review in this workspace.",
    },
  },
  {
    prefix: "/help/pilot-guide",
    entry: {
      whatIsThisPage:
        "Pilot guide — how to prepare for a pilot, run the first architecture review, interpret outputs, and get support.",
      whatToDoNext:
        "Start an architecture review, or open Your first architecture review when you need the step-by-step walkthrough.",
      whyEmpty: "This guide is always available; live pilot outcomes appear after reviews and sponsor reports exist.",
      whereToConfigurePrerequisite:
        "Running a pilot needs a workspace where operators can create and finalize architecture reviews.",
    },
  },
  {
    prefix: "/help/first-architecture-review",
    entry: {
      whatIsThisPage:
        "Your first architecture review — guided path from evidence intake to a finalized package and sponsor-ready exports.",
      whatToDoNext:
        "Start an architecture review from the hero CTA, or open the sample review when you want a completed outcome first.",
      whyEmpty: "This guide is always available; live review packages appear after you create architecture reviews.",
      whereToConfigurePrerequisite:
        "Creating reviews needs a role that can start architecture reviews in this workspace.",
    },
  },
  {
    prefix: "/help/core-pilot",
    entry: {
      whatIsThisPage:
        "Your first architecture review — guided path from evidence intake to a finalized package and sponsor-ready exports.",
      whatToDoNext:
        "Start an architecture review from the hero CTA, or open the sample review when you want a completed outcome first.",
      whyEmpty: "This guide is always available; live review packages appear after you create architecture reviews.",
      whereToConfigurePrerequisite:
        "Creating reviews needs a role that can start architecture reviews in this workspace.",
    },
  },
  {
    prefix: "/help/first-pilot-path",
    entry: {
      whatIsThisPage:
        "Your first architecture review — guided path from evidence intake to a finalized package and sponsor-ready exports.",
      whatToDoNext:
        "Start an architecture review from the hero CTA, or open the sample review when you want a completed outcome first.",
      whyEmpty: "This guide is always available; live review packages appear after you create architecture reviews.",
      whereToConfigurePrerequisite:
        "Creating reviews needs a role that can start architecture reviews in this workspace.",
    },
  },
  {
    prefix: "/help/first-hour-operator-path",
    entry: {
      whatIsThisPage:
        "Your first architecture review — guided path from evidence intake to a finalized package and sponsor-ready exports.",
      whatToDoNext:
        "Start an architecture review from the hero CTA, or open the sample review when you want a completed outcome first.",
      whyEmpty: "This guide is always available; live review packages appear after you create architecture reviews.",
      whereToConfigurePrerequisite:
        "Creating reviews needs a role that can start architecture reviews in this workspace.",
    },
  },
  {
    prefix: "/help/cloud-connections/azure",
    entry: {
      whatIsThisPage:
        "Connect Azure securely — workload identity federation, read-only roles, and validation without long-lived secrets.",
      whatToDoNext:
        "Follow the federation steps, then open the Azure cloud connection wizard to validate the attachment.",
      whyEmpty: "This guide is always available; live Azure connection status appears on the Cloud connections hub.",
      whereToConfigurePrerequisite:
        "Azure attachment is optional — evidence-only reviews work without a cloud connector.",
    },
  },
  {
    prefix: "/help/azure-permissions",
    entry: {
      whatIsThisPage:
        "Azure permissions — read-only roles, scopes, and verification steps for ArchLucid cloud connections.",
      whatToDoNext:
        "Open Cloud connections to configure Azure, or Connect Azure securely when you need the federation walkthrough.",
      whyEmpty: "This guide is always available; live permission checks appear after you configure an Azure connection.",
      whereToConfigurePrerequisite:
        "Assigning Azure roles needs cloud-admin authority in the target subscription.",
    },
  },
  {
    prefix: "/help/glossary",
    entry: {
      whatIsThisPage:
        "Glossary — searchable product terms for operators and buyers reviewing ArchLucid vocabulary.",
      whatToDoNext:
        "Look up a term, then open Getting started or Assurance status when you need live workflow or assurance orientation.",
      whyEmpty: "Glossary terms are always listed; search filters the catalog without needing a live review.",
      whereToConfigurePrerequisite:
        "No configuration is required — this page is orientation vocabulary only.",
    },
  },
  {
    prefix: "/help/operator-auth-roles",
    entry: {
      whatIsThisPage:
        "Users and roles — ArchLucid app roles, capabilities, and how operators invite teammates (alias of users-and-roles).",
      whatToDoNext:
        "Open Users settings to invite or assign roles, or Assurance status when you need assurance orientation.",
      whyEmpty: "This guide is always available; live directory rows appear after users are invited or provisioned.",
      whereToConfigurePrerequisite:
        "Managing users needs Admin authority; SSO may be required before invited users can sign in.",
    },
  },
  {
    prefix: "/help/users-and-roles",
    entry: {
      whatIsThisPage:
        "Users and roles — ArchLucid app roles, capabilities, and how operators invite teammates for this workspace.",
      whatToDoNext:
        "Open Users settings to invite or assign roles, or Assurance status when you need assurance orientation.",
      whyEmpty: "This guide is always available; live directory rows appear after users are invited or provisioned.",
      whereToConfigurePrerequisite:
        "Managing users needs Admin authority; SSO may be required before invited users can sign in.",
    },
  },
  {
    prefix: "/help/cloud-connections",
    entry: {
      whatIsThisPage:
        "Cloud connections help — how optional Azure, AWS, and GCP connectors supply read-only evidence for reviews.",
      whatToDoNext:
        "Open the Cloud connections hub to configure a provider, or read Connect Azure securely for federation steps.",
      whyEmpty: "This guide is always available; live connection status appears on the Cloud connections hub.",
      whereToConfigurePrerequisite:
        "Cloud connectors are optional — evidence-only reviews work without attaching a cloud account.",
    },
  },
  {
    prefix: "/administration/users/invite-reviewer",
    entry: {
      whatIsThisPage:
        "Invite a reviewer — send Reader or Auditor access so a teammate can sign off on architecture reviews.",
      whatToDoNext:
        "Enter the reviewer's email, send the invitation, then open Users and roles when you need the full directory or role matrix.",
      whyEmpty: "The invitation form is ready when you have Admin authority in this workspace.",
      whereToConfigurePrerequisite:
        "Workspace Admin authority is required; SSO may need to be configured before invited users can sign in.",
    },
  },
  {
    prefix: "/administration/users",
    entry: {
      whatIsThisPage:
        "Invite users, assign ArchLucid app roles, and manage API keys for this workspace tenant.",
      whatToDoNext:
        "Invite a teammate, open Roles and permissions to adjust authority, or manage API keys when you have Admin authority.",
      whyEmpty: "Directory rows appear after invitations are accepted or users are provisioned for this tenant.",
      whereToConfigurePrerequisite:
        "SSO and identity-provider mapping may be required before enterprise users can sign in.",
    },
  },
  {
    prefix: LEGACY_SETTINGS_ROLES_PATH,
    entry: {
      whatIsThisPage:
        "Invite users, assign ArchLucid app roles, and manage API keys for this workspace tenant.",
      whatToDoNext:
        "Invite a teammate, open Roles and permissions to adjust authority, or manage API keys when you have Admin authority.",
      whyEmpty: "Directory rows appear after invitations are accepted or users are provisioned for this tenant.",
      whereToConfigurePrerequisite:
        "SSO and identity-provider mapping may be required before enterprise users can sign in.",
    },
  },
  {
    prefix: "/administration/identity-providers/role-mapping",
    entry: {
      whatIsThisPage:
        "Role mapping - see how IdP groups or claims become ArchLucid app roles for this workspace tenant.",
      whatToDoNext:
        "Review mapping status, edit SAML role mapping when needed, then open diagnostics to test claims before inviting users.",
      whyEmpty:
        "Status cards load after auth diagnostics respond; Unmapped means no elevated roles until a matching claim is configured.",
      whereToConfigurePrerequisite:
        "Editing mappings needs Admin authority and a configured SAML or OIDC identity source.",
    },
  },
  {
    prefix: "/administration/api-keys",
    entry: {
      whatIsThisPage:
        "API keys - manage Admin and read-only automation credentials for approved enterprise workspace access.",
      whatToDoNext:
        "Review credential status, rotate or issue overlap keys when needed, then open Audit when rotation events need a governed trail.",
      whyEmpty:
        "Summary and credential rows load after API key settings respond; enterprise-only workspaces may keep this surface disabled.",
      whereToConfigurePrerequisite:
        "Rotating keys needs Admin authority; some tenants require SSO-only sign-in and disable API keys.",
    },
  },
  {
    prefix: "/administration/preferences",
    entry: {
      whatIsThisPage:
        "Preferences - personal appearance settings saved to your ArchLucid account for this device and signed-in profile.",
      whatToDoNext:
        "Choose a theme, then open Account security when sign-in controls need attention or Getting started for onboarding.",
      whyEmpty:
        "Theme controls are ready whenever you are signed in; saved preferences sync after the preferences API responds.",
      whereToConfigurePrerequisite:
        "No Admin role is required - preferences write only your own account record.",
    },
  },
  {
    prefix: "/administration/account-security",
    entry: {
      whatIsThisPage:
        "Account security - manage personal sign-in methods linked to your ArchLucid account for this workspace.",
      whatToDoNext:
        "Review linked methods, add email after a fresh sign-in when needed, then open Preferences or Security and trust help for related controls.",
      whyEmpty:
        "Method rows load after the sign-in methods API responds; empty lists mean no secondary methods are linked yet.",
      whereToConfigurePrerequisite:
        "Adding or removing methods needs a recent sign-in; email matches alone never link accounts.",
    },
  },
  {
    prefix: "/administration/auth-domains",
    entry: {
      whatIsThisPage:
        "Sign-in domains - verify email domain ownership, test SSO routing, and enable domain enforcement for this workspace.",
      whatToDoNext:
        "Add and verify a domain, test routing, then open Identity providers before enabling SSO enforcement.",
      whyEmpty:
        "Domain rows load after the auth-domains API responds; unverified domains stay pending until DNS TXT succeeds.",
      whereToConfigurePrerequisite:
        "Enforcement needs Admin authority, a verified domain, recovery admins, and a configured identity provider.",
    },
  },
  {
    prefix: "/administration/security-trust",
    entry: {
      whatIsThisPage:
        "Operator Security & trust — procurement-oriented materials, tenant isolation posture, retention notes, and NDA-gated diligence requests for this workspace.",
      whatToDoNext:
        "Open Assurance status or Trust Center for assurance surfaces, or Audit when you need governed activity trails.",
      whyEmpty:
        "Public materials list here when published; NDA-gated packs require contacting security@archlucid.net.",
      whereToConfigurePrerequisite:
        "No workspace toggle is required — this page orients operators to published and NDA diligence paths.",
    },
  },
  {
    prefix: "/administration/billing",
    entry: {
      whatIsThisPage:
        "Billing & plans - view the current subscription, compare available plans, and manage usage and wallet controls for this workspace.",
      whatToDoNext:
        "Review the current plan card, compare Available plans, then open AI usage or Billing help when spend questions need methodology.",
      whyEmpty:
        "Plan and usage cards appear after billing data loads for this tenant; wallet controls need Admin authority to mutate.",
      whereToConfigurePrerequisite:
        "Changing plans or payment methods needs a role that can manage workspace billing.",
    },
  },
  {
    prefix: "/administration/ai-usage",
    entry: {
      whatIsThisPage:
        "AI usage and cost - monitor estimated AI spend, remaining budget, and the workflows driving cost for this workspace.",
      whatToDoNext:
        "Review KPIs and daily usage, then open Billing & plans when budget caps or plan changes are needed.",
      whyEmpty:
        "Spend cards appear after cost-reporting data loads; quiet empty periods hide zeroed cockpit noise until activity resumes.",
      whereToConfigurePrerequisite:
        "Budget edits need a role that can manage workspace billing; estimated spend is not invoice-accurate.",
    },
  },
  {
    prefix: "/administration/baseline",
    entry: {
      whatIsThisPage:
        "Baseline settings - capture ROI measurement anchors (review cycle hours, prep time, people per review) for this workspace.",
      whatToDoNext:
        "Save or clear baseline anchors, then open Pilot ROI model help or Architecture scorecard when numbers need methodology.",
      whyEmpty:
        "Fields load after tenant baseline API responds; empty values mean conservative defaults until you save anchors.",
      whereToConfigurePrerequisite:
        "Saving baseline anchors needs Execute authority in this workspace.",
    },
  },
  {
    prefix: "/integrations/cloud-connections",
    entry: {
      whatIsThisPage:
        "Connect Azure, AWS, or Google Cloud for optional read-only evidence collection, or start evidence-only reviews without a cloud connector.",
      whatToDoNext:
        "Choose platforms to show, open a provider to configure federation, or start an evidence-only review from uploaded packages.",
      whyEmpty:
        "Provider cards stay Not connected until you configure a Tier 2 connection; evidence-only upload stays available anytime.",
      whereToConfigurePrerequisite:
        "Choose a workspace in the header scope switcher before changing which platforms appear — filters save per workspace.",
    },
  },
  {
    prefix: "/integrations/jira",
    entry: {
      whatIsThisPage:
        "Jira integration — outbound work-item settings, connection health, and tenant overrides for creating Jira issues from ArchLucid.",
      whatToDoNext:
        "Test the connector, set project and severity mappings, then open Integration readiness when the path is not ready.",
      whyEmpty: "Health and settings load after this workspace can reach the ITSM connector configuration.",
      whereToConfigurePrerequisite:
        "Platform credentials are often configured by an administrator; tenant overrides on this page need Operate authority.",
    },
  },
  {
    prefix: "/integrations/itsm/oauth/callback",
    entry: {
      whatIsThisPage:
        "Atlassian OAuth callback — completes Jira connector consent after Atlassian redirects back to ArchLucid.",
      whatToDoNext:
        "When consent succeeds, return to Jira integration settings to run a health probe; on failure, retry Connect with Atlassian.",
      whyEmpty: "This page only appears after an OAuth redirect; status text replaces empty layouts.",
      whereToConfigurePrerequisite:
        "Starting OAuth requires Operate authority and a configured Atlassian app registration.",
    },
  },
  {
    prefix: "/integrations/servicenow",
    entry: {
      whatIsThisPage:
        "ServiceNow integration — outbound incident settings, connection health, and CMDB overrides for creating ServiceNow records from ArchLucid.",
      whatToDoNext:
        "Test the connector, adjust CMDB auto-create if needed, then open Integration readiness when the path is not ready.",
      whyEmpty: "Health and settings load after this workspace can reach the ITSM connector configuration.",
      whereToConfigurePrerequisite:
        "Platform credentials are often configured by an administrator; tenant overrides on this page need Operate authority.",
    },
  },
  {
    prefix: "/integrations/slack",
    entry: {
      whatIsThisPage:
        "Slack integration — configure incoming webhook destinations that receive governance alerts for this workspace.",
      whatToDoNext:
        "Add or test a Slack destination, then open Alert rules when you need to change which events fire notifications.",
      whyEmpty: "Destinations appear after you save an incoming webhook URL for this workspace.",
      whereToConfigurePrerequisite:
        "Creating or changing destinations requires a role that can manage alert routing.",
    },
  },
  {
    prefix: "/integrations/webhooks",
    entry: {
      whatIsThisPage:
        "Webhooks — configure HTTPS webhook subscriptions that receive governance alerts for this workspace.",
      whatToDoNext:
        "Add or test a subscription, then open Alert rules when you need to change which events fire notifications.",
      whyEmpty: "Subscriptions appear after you save a webhook URL for this workspace.",
      whereToConfigurePrerequisite:
        "Creating or changing subscriptions requires a role that can manage alert routing.",
    },
  },
  {
    prefix: "/operate/integration-events/dlq",
    entry: {
      whatIsThisPage:
        "Integration event dead letters — Internal Operations queue for outbound integration publishes that exceeded retries.",
      whatToDoNext:
        "Inspect the failing event, fix connector or destination root cause, then retry or suppress; open Integration readiness or System health for posture.",
      whyEmpty: "An empty list means no dead-lettered outbox rows are waiting across tenants.",
      whereToConfigurePrerequisite:
        "Admin authority is required to retry or suppress; the queue spans all tenants, not only the header workspace.",
    },
  },
  {
    prefix: "/integrations/teams",
    entry: {
      whatIsThisPage:
        "Microsoft Teams integration — configure a Teams channel destination that receives governance alerts for this workspace.",
      whatToDoNext:
        "Save or test the Teams connector, then open Alert rules when you need to change which events fire notifications.",
      whyEmpty: "Connection status appears after this workspace can load Teams notification settings.",
      whereToConfigurePrerequisite:
        "Creating or changing the Teams destination requires a role that can manage alert routing.",
    },
  },
  {
    prefix: "/settings/cloud-connections",
    entry: {
      whatIsThisPage:
        "Legacy cloud-connections URL — redirects to the Integrations cloud connections landing hub.",
      whatToDoNext: "Use the redirected Cloud connections page to configure providers or evidence-only upload.",
      whyEmpty: "This path only redirects; connection status appears on the canonical Integrations page.",
      whereToConfigurePrerequisite: "Choose a workspace in the header scope switcher on the destination page.",
    },
  },
];

/** All registry rows — exported for content-constraint Vitest guards. */
export function allPageContextualHelpRows(): readonly PageContextualHelpRow[] {
  return PAGE_CONTEXTUAL_HELP;
}

/** Resolve short-form contextual help for an operator pathname, or `null` when not migrated yet. */
export function contextualHelpForPathname(pathname: string): PageContextualHelpEntry | null {
  const path = (pathname ?? "").split("?")[0] ?? "";

  if (pathIsRunProvenance(path)) {
    return PROVENANCE_CONTEXTUAL_HELP;
  }

  const sorted = [...PAGE_CONTEXTUAL_HELP].sort((left, right) => right.prefix.length - left.prefix.length);

  for (const row of sorted) {
    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      return row.entry;
    }
  }

  return null;
}
