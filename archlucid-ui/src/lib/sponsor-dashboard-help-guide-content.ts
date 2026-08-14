import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { SPONSOR_DASHBOARD_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import { ARCHITECTURE_SPONSOR_DASHBOARD_CANONICAL_PATH } from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import {
  SPONSOR_DASHBOARD_PAGE_SUBTITLE_BUYER,
  SPONSOR_DASHBOARD_PAGE_TITLE,
} from "@/lib/sponsor/sponsor-dashboard-page-copy";

export const SPONSOR_DASHBOARD_HELP_PAGE_TITLE = SPONSOR_DASHBOARD_PAGE_TITLE;

export const SPONSOR_DASHBOARD_HELP_PAGE_SUBTITLE = SPONSOR_DASHBOARD_PAGE_SUBTITLE_BUYER;

export const SPONSOR_DASHBOARD_HELP_OVERVIEW =
  "The sponsor dashboard summarizes portfolio ROI trends, workspace-health KPI tiles, and sponsor exports for the selected scope. Use it for governance posture at a glance — not as a sealed-review diligence Sources package.";

export const SPONSOR_DASHBOARD_HELP_PRIMARY_ACTION = {
  label: "Open sponsor dashboard",
  href: ARCHITECTURE_SPONSOR_DASHBOARD_CANONICAL_PATH,
} as const;

export type SponsorDashboardHelpItem = {
  readonly label: string;
  readonly detail: string;
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
] as const;

export const SPONSOR_DASHBOARD_HELP_HOW_TO_READ_STEPS = [
  "Confirm workspace or project scope in the header switcher — figures never roll up across workspaces.",
  "Review KPI tiles and ROI trends, then refresh when you need updated portfolio signals.",
  "Open sponsor exports or sponsor report help when briefing materials need a period narrative.",
] as const;

export const SPONSOR_DASHBOARD_HELP_SPONSOR_SUMMARY_HREF = "/help/sponsor-report";

export const SPONSOR_DASHBOARD_HELP_SCORECARD_HREF = "/insights/architecture-scorecard";

export const SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-sponsor-dashboard-shows", title: "What the sponsor dashboard shows" },
  { level: 2, id: "how-sponsor-dashboard-works", title: SPONSOR_DASHBOARD_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
