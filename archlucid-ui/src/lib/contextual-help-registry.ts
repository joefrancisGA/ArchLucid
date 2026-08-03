/**
 * Page-scoped context-sensitive help (Category 1 IA taxonomy) — short answers to up to four
 * questions per operator route. Long-form guides remain on `/help/{slug}` via `page-help-topic-map.ts`.
 */

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
    prefix: "/architecture/reviews",
    entry: {
      whatIsThisPage: "Create, refine, evaluate, and approve architecture reviews from one hub.",
      whatToDoNext: "Start a review, resume a draft, or explore a sample workspace.",
      whyEmpty: "Summary metrics populate after you start or finalize architecture reviews.",
      whereToConfigurePrerequisite: "Switch workspace or project scope from the header switcher.",
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
    prefix: "/planning",
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
    prefix: "/value-report",
    entry: {
      whatIsThisPage:
        "Create a sponsor-ready report summarizing finalized reviews, findings, governance activity, and estimated ROI.",
      whatToDoNext: "Set the report period, refresh the preview, then generate sponsor exports when data is ready.",
      whyEmpty: "The preview fills in after you finalize reviews in the selected period.",
      whereToConfigurePrerequisite: "ROI estimates use baseline settings from workspace configuration.",
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

  const sorted = [...PAGE_CONTEXTUAL_HELP].sort((left, right) => right.prefix.length - left.prefix.length);

  for (const row of sorted) {
    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      return row.entry;
    }
  }

  return null;
}
