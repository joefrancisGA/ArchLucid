import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  SPONSOR_DASHBOARD_HELP_TOPIC_LABEL,
  ARCHITECTURE_SPONSOR_DASHBOARD_CANONICAL_PATH,
} from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import { BASELINE_SETTINGS_HELP_CANONICAL_PATH } from "@/lib/baseline-settings-help-evidence-copy";
import { SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/sponsor-dashboard-help-evidence-copy";
import { SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF } from "@/lib/sponsor/sponsor-dashboard-route";

export const SPONSOR_DASHBOARD_HELP_BREADCRUMB_TOPIC_TITLE = "Sponsor dashboard help";

export const SPONSOR_DASHBOARD_HELP_PAGE_TITLE = "Sponsor dashboard";

export const SPONSOR_DASHBOARD_HELP_PAGE_SUBTITLE =
  "How portfolio ROI trends, workspace-health KPI tiles, and sponsor exports fit sponsor briefings.";

export const SPONSOR_DASHBOARD_HELP_PAGE_SUBTITLE_BUYER =
  "Portfolio ROI, workspace-health KPIs, and sponsor exports for sponsor briefings in this workspace." as const;

export const SPONSOR_DASHBOARD_HELP_PRIMARY_CONTENT_ID = "help-sponsor-dashboard-primary-content" as const;

export const SPONSOR_DASHBOARD_HELP_SKIP_LINK_LABEL = "Skip to sponsor dashboard guide" as const;

export function sponsorDashboardHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? SPONSOR_DASHBOARD_HELP_PAGE_SUBTITLE_BUYER
    : SPONSOR_DASHBOARD_HELP_PAGE_SUBTITLE;
}

export const SPONSOR_DASHBOARD_HELP_OVERVIEW =
  "The sponsor dashboard summarizes portfolio ROI trends, workspace-health KPI tiles, and sponsor exports for the selected scope — use it for approval and ROI status at a glance before opening sponsor report help or architecture scorecard follow-ups.";

export const SPONSOR_DASHBOARD_HELP_PRIMARY_ACTION = {
  label: "Open sponsor dashboard",
  href: ARCHITECTURE_SPONSOR_DASHBOARD_CANONICAL_PATH,
} as const;

export const SPONSOR_DASHBOARD_HELP_READINESS_SECTION_TITLE = "Workspace scope";

export const SPONSOR_DASHBOARD_HELP_SCOPE_PRECONDITION =
  "Switch workspace or project scope from the header switcher — figures never roll up across workspaces.";

export const SPONSOR_DASHBOARD_HELP_SCORECARD_HREF = "/insights/architecture-scorecard";

export const SPONSOR_DASHBOARD_HELP_SPONSOR_SUMMARY_HREF = "/help/sponsor-report";

export type SponsorDashboardHelpItem = {
  readonly label: string;
  readonly detail: string;
  readonly href?: string;
};

export const SPONSOR_DASHBOARD_HELP_FEATURE_ITEMS: readonly SponsorDashboardHelpItem[] = [
  {
    label: "Portfolio KPI tiles",
    detail: "Track finalized reviews, material findings, and approval decisions for the current workspace scope.",
  },
  {
    label: "ROI trends",
    detail: "Directional ROI estimates use baseline settings and finalized review activity in the selected window.",
    href: BASELINE_SETTINGS_HELP_CANONICAL_PATH,
  },
  {
    label: "Sponsor exports",
    detail: "Generate export-ready outputs when portfolio data is ready for sponsor briefings.",
    href: SPONSOR_DASHBOARD_HELP_SPONSOR_SUMMARY_HREF,
  },
  {
    label: "Workspace health",
    detail: "Open workspace health or the approval queue when KPI tiles need approval follow-up.",
    href: SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF,
  },
  {
    label: "Architecture scorecard",
    detail: "Open the architecture scorecard when portfolio KPIs need scorecard context beyond dashboard tiles.",
    href: SPONSOR_DASHBOARD_HELP_SCORECARD_HREF,
  },
] as const;

export const SPONSOR_DASHBOARD_HELP_HOW_TO_READ_STEPS = [
  "Review KPI tiles and ROI trends, then refresh when you need updated portfolio signals.",
  "Open sponsor exports or sponsor report help when briefing materials need a period narrative.",
  "Confirm baseline settings when ROI trends need traceable anchors before sponsor briefings.",
] as const;

export const SPONSOR_DASHBOARD_HELP_BEFORE_YOU_START_TITLE = "Before you start";

export const SPONSOR_DASHBOARD_HELP_BEFORE_YOU_START_BODY =
  "Sponsor dashboard figures reflect finalized reviews and approval activity in the selected workspace or project — confirm scope in the header before briefing sponsors or exporting portfolio data.";

export const SPONSOR_DASHBOARD_HELP_CLAIM_HEADING_ID = "help-sponsor-dashboard-claim-discipline-heading" as const;

export const SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "before-you-start", title: SPONSOR_DASHBOARD_HELP_BEFORE_YOU_START_TITLE },
  { level: 2, id: "what-sponsor-dashboard-shows", title: "What the sponsor dashboard shows" },
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

/** Drift guard: scope roll-up copy appears once on the page (header actions). */
export const SPONSOR_DASHBOARD_HELP_SCOPE_ROLLUP_PHRASE = "figures never roll up across workspaces" as const;
