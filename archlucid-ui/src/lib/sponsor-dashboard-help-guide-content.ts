import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  SPONSOR_DASHBOARD_HELP_TOPIC_LABEL,
  ARCHITECTURE_SPONSOR_DASHBOARD_CANONICAL_PATH,
} from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import { SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/sponsor-dashboard-help-evidence-copy";

export const SPONSOR_DASHBOARD_HELP_BREADCRUMB_TOPIC_TITLE = "Sponsor dashboard";

export const SPONSOR_DASHBOARD_HELP_PAGE_TITLE = "Sponsor dashboard";

export const SPONSOR_DASHBOARD_HELP_PAGE_SUBTITLE =
  "How portfolio ROI trends, workspace-health KPI tiles, and sponsor exports fit sponsor governance briefings.";

export const SPONSOR_DASHBOARD_HELP_OVERVIEW =
  "The sponsor dashboard summarizes portfolio ROI trends, workspace-health KPI tiles, and sponsor exports for the selected scope — use it for governance posture at a glance before opening sponsor report help or architecture scorecard follow-ups.";

export const SPONSOR_DASHBOARD_HELP_PRIMARY_ACTION = {
  label: "Open sponsor dashboard",
  href: ARCHITECTURE_SPONSOR_DASHBOARD_CANONICAL_PATH,
} as const;

export const SPONSOR_DASHBOARD_HELP_START_HERE_CARD_TITLE = "Start here";

export const SPONSOR_DASHBOARD_HELP_SCOPE_PRECONDITION_TAG = "Workspace scope";

export const SPONSOR_DASHBOARD_HELP_SCOPE_PRECONDITION =
  "Switch workspace or project scope from the header switcher — figures never roll up across workspaces.";

export const SPONSOR_DASHBOARD_HELP_SCORECARD_HREF = "/insights/architecture-scorecard";

export type SponsorDashboardHelpItem = {
  readonly label: string;
  readonly detail: string;
  readonly href?: string;
};

export const SPONSOR_DASHBOARD_HELP_FEATURE_ITEMS: readonly SponsorDashboardHelpItem[] = [
  {
    label: "Portfolio KPI tiles",
    detail: "Track finalized reviews, material findings, and governance decisions for the current workspace scope.",
  },
  {
    label: "ROI trends",
    detail: "Directional ROI estimates use baseline settings and finalized review activity in the selected window.",
  },
  {
    label: "Sponsor exports",
    detail: "Generate sponsor-ready exports when portfolio data is ready for sponsor briefings.",
  },
  {
    label: "Workspace health",
    detail: "Open workspace health or the approval queue when KPI tiles need governance follow-up.",
  },
  {
    label: "Architecture scorecard",
    detail: "Open the architecture scorecard when portfolio KPIs need scorecard context beyond dashboard tiles.",
    href: SPONSOR_DASHBOARD_HELP_SCORECARD_HREF,
  },
] as const;

export const SPONSOR_DASHBOARD_HELP_HOW_TO_READ_STEPS = [
  "Confirm workspace or project scope in the header switcher — figures never roll up across workspaces.",
  "Review KPI tiles and ROI trends, then refresh when you need updated portfolio signals.",
  "Open sponsor exports or sponsor report help when briefing materials need a period narrative.",
] as const;

export const SPONSOR_DASHBOARD_HELP_SPONSOR_SUMMARY_HREF = "/help/sponsor-report";

export const SPONSOR_DASHBOARD_HELP_BEFORE_YOU_START_TITLE = "Before you start";

export const SPONSOR_DASHBOARD_HELP_BEFORE_YOU_START_BODY =
  "Sponsor dashboard figures reflect finalized reviews and governance activity in the selected workspace or project — confirm scope in the header before briefing sponsors or exporting portfolio data.";

export const SPONSOR_DASHBOARD_HELP_CLAIM_HEADING_ID = "help-sponsor-dashboard-claim-discipline-heading" as const;

export const SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-sponsor-dashboard-shows", title: "What the sponsor dashboard shows" },
  { level: 2, id: "before-you-start", title: SPONSOR_DASHBOARD_HELP_BEFORE_YOU_START_TITLE },
  { level: 2, id: "how-sponsor-dashboard-works", title: SPONSOR_DASHBOARD_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: SPONSOR_DASHBOARD_HELP_CLAIM_HEADING_ID,
    title: SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: claim band owns diligence limits; overview and steps stay affirmative. */
export const SPONSOR_DASHBOARD_HELP_NEGATION_DRIFT_MARKERS = {
  claimMustNotContain: ["sources package", "sealed-review diligence"],
} as const;
