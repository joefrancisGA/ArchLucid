/**
 * Page-scoped context-sensitive help (Category 1 IA taxonomy) — short answers to up to four
 * questions per operator route. Long-form guides remain on `/help/{slug}` via `page-help-topic-map.ts`.
 */

import {
  PROVENANCE_CONTEXTUAL_HELP,
  pathIsRunProvenance,
} from "@/lib/provenance-evidence-copy";

export type PageContextualHelpEntry = {
  readonly whatIsThisPage: string;
  readonly whatToDoNext: string;
  readonly whyEmpty?: string;
  readonly whereToConfigurePrerequisite?: string;
};

type PageContextualHelpRow = {
  readonly prefix: string;
  readonly entry: PageContextualHelpEntry;
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
        "Open Trust Center or Security and trust for diligence artifacts, then review Sources before sponsor briefings.",
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
        "Filter by review or action, refresh the trail, then export or open the related architecture review when needed.",
      whyEmpty: "Events appear after operators take actions that the audit coverage matrix records.",
      whereToConfigurePrerequisite:
        "Audit retention and export privileges follow workspace role and enterprise controls.",
    },
  },
  {
    prefix: "/administration/system-health",
    entry: {
      whatIsThisPage:
        "Check workspace service health, required dependencies, and deployment identity for this tenant.",
      whatToDoNext:
        "Refresh readiness, open Connection status when a dependency fails, or follow Troubleshooting help.",
      whyEmpty: "Health rows appear after the readiness probe returns for this workspace.",
      whereToConfigurePrerequisite:
        "Dependency connectivity is configured under Administration connection settings.",
    },
  },
  {
    prefix: "/digests",
    entry: {
      whatIsThisPage:
        "Send scheduled summaries of review activity, governance signals, findings, and advisory scans.",
      whatToDoNext: "Open the Schedule tab to set timing and recipients, then preview or send a test digest.",
      whyEmpty: "Generated digests appear here after a schedule and recipients are configured.",
      whereToConfigurePrerequisite:
        "Recipient subscriptions and executive rollup settings live on the Schedule tab.",
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
      whyEmpty: "Lineage appears after an approval request exists for a finalized architecture review.",
      whereToConfigurePrerequisite:
        "Submit or open an approval from the governance approval queue after a review is ready for decision.",
    },
  },
  {
    prefix: "/signed-records",
    entry: {
      whatIsThisPage:
        "Signed review record — the finalized package of decisions, findings, and downloadable artifacts for one architecture review.",
      whatToDoNext:
        "Review the summary and decisions, open related findings, or export the review bundle when downloads are ready.",
      whyEmpty: "A signed review record appears after you finalize an architecture review.",
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
    prefix: "/administration/settings/users",
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
