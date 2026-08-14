import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  SYSTEM_HEALTH_HELP_TOPIC_LABEL,
  SYSTEM_HEALTH_CANONICAL_PATH,
} from "@/lib/system-health-evidence-copy";
import {
  SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR,
  SYSTEM_HEALTH_PAGE_TITLE,
} from "@/lib/system-health-page-copy";

export const SYSTEM_HEALTH_HELP_PAGE_TITLE = SYSTEM_HEALTH_PAGE_TITLE;

export const SYSTEM_HEALTH_HELP_PAGE_SUBTITLE = SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR;

export const SYSTEM_HEALTH_HELP_OVERVIEW =
  "System health reports workspace operational readiness — live and ready checks plus deployment identity. Use it to confirm dependencies before reviews depend on them, not as a sealed-review diligence Sources package.";

export const SYSTEM_HEALTH_HELP_PRIMARY_ACTION = {
  label: "Open system health",
  href: SYSTEM_HEALTH_CANONICAL_PATH,
} as const;

export type SystemHealthHelpTileItem = {
  readonly label: string;
  readonly detail: string;
};

export const SYSTEM_HEALTH_HELP_TILE_ITEMS: readonly SystemHealthHelpTileItem[] = [
  {
    label: "Readiness probes",
    detail: "Live and ready rows show whether core services and required dependencies respond for this tenant.",
  },
  {
    label: "Deployment identity",
    detail: "Build and version stamps help operators confirm which release is serving the workspace.",
  },
  {
    label: "Manual refresh",
    detail: "Health loads once per visit and on demand — it does not stream continuously.",
  },
  {
    label: "Follow-up surfaces",
    detail: "Open connection status when a connector needs setup, or troubleshooting when runtime failures persist.",
  },
] as const;

export const SYSTEM_HEALTH_HELP_HOW_TO_READ_STEPS = [
  "Refresh readiness when a review or integration workflow depends on live dependencies.",
  "Scan failing rows for the connector or service that needs attention.",
  "Open connection status or troubleshooting help when health questions turn into setup or runbook work.",
] as const;

export const SYSTEM_HEALTH_HELP_TROUBLESHOOTING_HREF = "/help/troubleshooting";

export const SYSTEM_HEALTH_HELP_CONNECTION_STATUS_HREF = "/help/connection-status";

export const SYSTEM_HEALTH_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-system-health-shows", title: "What system health shows" },
  { level: 2, id: "how-system-health-works", title: SYSTEM_HEALTH_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
