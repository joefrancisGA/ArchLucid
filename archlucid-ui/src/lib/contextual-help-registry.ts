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
    prefix: "/reviews",
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
