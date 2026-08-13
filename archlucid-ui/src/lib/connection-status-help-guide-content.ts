import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { CONNECTION_STATUS_HELP_TOPIC_LABEL } from "@/lib/connection-status-evidence-copy";
import { CONNECTION_STATUS_CANONICAL_PATH } from "@/lib/connection-status-evidence-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export { CONNECTION_STATUS_HELP_TOPIC_LABEL };

export const CONNECTION_STATUS_HELP_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.integrationReadiness;

export const CONNECTION_STATUS_HELP_PAGE_SUBTITLE =
  "See which workspace integrations are configured, recommended, or need attention before reviews depend on them.";

export const CONNECTION_STATUS_HELP_OVERVIEW =
  "Connection status is the operator readiness dashboard for connectors, webhooks, and cloud links. Use it to see what is wired today and which follow-up surfaces finish setup — not as a signed-review evidence trail by itself.";

export const CONNECTION_STATUS_HELP_PRIMARY_ACTION = {
  label: "Open connection status",
  href: CONNECTION_STATUS_CANONICAL_PATH,
} as const;

export type ConnectionStatusHelpTileItem = {
  readonly label: string;
  readonly detail: string;
};

export const CONNECTION_STATUS_HELP_TILE_ITEMS: readonly ConnectionStatusHelpTileItem[] = [
  {
    label: "Configured connectors",
    detail: "Tiles show live configuration state for cloud, ITSM, chat, and webhook integrations.",
  },
  {
    label: "Recommended next steps",
    detail: "Follow connector pages when a tile shows setup or validation is still required.",
  },
  {
    label: "System health",
    detail: "Open system health when dependency checks or runtime failures need investigation.",
  },
  {
    label: "Integration methodology",
    detail: "Read integration readiness help for procurement-oriented setup guidance.",
  },
] as const;

export const CONNECTION_STATUS_HELP_HOW_TO_READ_STEPS = [
  "Scan tiles for connectors your pilot or workspace depends on.",
  "Open the connector surface when a tile shows setup, validation, or credential work remains.",
  "Use system health or audit when readiness questions turn into runtime or governance trails.",
] as const;

export const CONNECTION_STATUS_HELP_METHODOLOGY_HREF = inAppHelpHref("integration-readiness");

export const CONNECTION_STATUS_HELP_METHODOLOGY_LABEL = "Read integration readiness help";

export const CONNECTION_STATUS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-connection-status-shows", title: "What connection status shows" },
  { level: 2, id: "how-to-read-connection-status", title: CONNECTION_STATUS_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
