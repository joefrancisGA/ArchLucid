import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HEALTH_READINESS_ANCHOR_ID } from "@/lib/health-dashboard-anchors";
import {
  SYSTEM_HEALTH_CANONICAL_PATH,
  SYSTEM_HEALTH_HELP_TOPIC_LABEL,
} from "@/lib/system-health-evidence-copy";
import { SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/system-health-help-evidence-copy";

export const SYSTEM_HEALTH_HELP_PAGE_TITLE = "System health";

export const SYSTEM_HEALTH_HELP_BREADCRUMB_TOPIC_TITLE = "System health guide";

export const SYSTEM_HEALTH_HELP_PAGE_SUBTITLE =
  "How to read readiness probes, deployment identity, and dependency follow-ups for this workspace.";

export const SYSTEM_HEALTH_HELP_OVERVIEW =
  "System health reports workspace operational readiness — live and ready checks plus deployment identity. Use it to confirm dependencies before reviews depend on them.";

/** Readiness refresh guidance — shown under overview; primary CTA lives in the page header. */
export const SYSTEM_HEALTH_HELP_READINESS_HELPER = "Readiness loads once per visit and on demand.";

export const SYSTEM_HEALTH_HELP_PRIMARY_ACTION = {
  label: "Open system health",
  href: SYSTEM_HEALTH_CANONICAL_PATH,
} as const;

export const SYSTEM_HEALTH_HELP_READINESS_HREF =
  `${SYSTEM_HEALTH_CANONICAL_PATH}#${HEALTH_READINESS_ANCHOR_ID}` as const;

export const SYSTEM_HEALTH_HELP_CONNECTION_STATUS_HREF = "/administration/connection-status";

export type SystemHealthHelpTileItem = {
  readonly label: string;
  readonly detail: string;
  readonly href?: string;
};

export const SYSTEM_HEALTH_HELP_TILE_ITEMS: readonly SystemHealthHelpTileItem[] = [
  {
    label: "Readiness probes",
    detail: "Live and ready rows show whether core services and required dependencies respond for this tenant.",
    href: SYSTEM_HEALTH_HELP_READINESS_HREF,
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
    href: SYSTEM_HEALTH_HELP_CONNECTION_STATUS_HREF,
  },
] as const;

export const SYSTEM_HEALTH_HELP_HOW_TO_READ_STEPS = [
  "Refresh readiness when a review or integration workflow depends on live dependencies.",
  "Scan failing rows for the connector or service that needs attention.",
  "Open connection status or troubleshooting help when health questions turn into setup or runbook work.",
] as const;

export const SYSTEM_HEALTH_HELP_CLAIM_HEADING_ID = "help-system-health-claim-discipline-heading" as const;

export const SYSTEM_HEALTH_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-system-health-shows", title: "What system health shows" },
  { level: 2, id: "how-system-health-works", title: SYSTEM_HEALTH_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: SYSTEM_HEALTH_HELP_CLAIM_HEADING_ID,
    title: SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: overview stays positive-only; claim band owns the audit-export negation once. */
export const SYSTEM_HEALTH_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: ["not a full audit export", "not a diligence Sources trail"],
  claimMustContain: "not a full audit export",
} as const;
