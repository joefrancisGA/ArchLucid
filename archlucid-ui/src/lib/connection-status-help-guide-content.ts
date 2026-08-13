import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { CONNECTION_STATUS_HELP_TOPIC_LABEL } from "@/lib/connection-status-evidence-copy";
import { CONNECTION_STATUS_CANONICAL_PATH } from "@/lib/connection-status-evidence-copy";
import { CONNECTOR_PURPOSE_GROUPS } from "@/lib/connector-operations-present";
import { INTEGRATION_READINESS_SUMMARY_TILE_LABELS } from "@/lib/connector-readiness-summary";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export { CONNECTION_STATUS_HELP_TOPIC_LABEL };

export const CONNECTION_STATUS_HELP_PAGE_TITLE = "Connection status";

export const CONNECTION_STATUS_HELP_PAGE_SUBTITLE =
  "See which workspace integrations are ready, recommended, or optional before reviews depend on them.";

export const CONNECTION_STATUS_HELP_OVERVIEW =
  "Connection status is the operator readiness dashboard for connectors, webhooks, and cloud links. The live page opens with a summary strip of aggregate counts, then a connector inventory table grouped by purpose — not as a signed-review diligence package.";

export const CONNECTION_STATUS_HELP_PRIMARY_ACTION = {
  label: "Open connection status",
  href: CONNECTION_STATUS_CANONICAL_PATH,
} as const;

export const CONNECTION_STATUS_HELP_READINESS_SECTION_TITLE = "This workspace";

export const CONNECTION_STATUS_HELP_STATUS_LEGEND_HEADING = "Status tags on the inventory";

export const CONNECTION_STATUS_HELP_STATUS_LEGEND_INTRO =
  "Each connector row shows one of these status tags. Match the tag before you open a connector page.";

export type ConnectionStatusHelpSurfaceItem = {
  readonly label: string;
  readonly detail: string;
};

export const CONNECTION_STATUS_HELP_SURFACE_ITEMS: readonly ConnectionStatusHelpSurfaceItem[] = [
  {
    label: "Summary strip",
    detail: `Five counts at the top (${INTEGRATION_READINESS_SUMMARY_TILE_LABELS.join(", ")}) — scan these first for pilot readiness.`,
  },
  {
    label: "Connector inventory table",
    detail: `Rows grouped by purpose (${CONNECTOR_PURPOSE_GROUPS.map((group) => group.title).join("; ")}) with a status tag per connector.`,
  },
  {
    label: "Recommended next steps",
    detail: "Open the matching integration page when a row shows setup or validation work remains.",
  },
] as const;

export const CONNECTION_STATUS_HELP_HOW_TO_READ_STEPS = [
  "Scan the summary strip for aggregate counts your pilot depends on.",
  "Open the connector inventory table and find the row for the integration you need.",
  "Follow the connector page when a row shows setup, validation, or credential work remains.",
] as const;

export const CONNECTION_STATUS_HELP_METHODOLOGY_HREF = inAppHelpHref("integration-readiness");

export const CONNECTION_STATUS_HELP_METHODOLOGY_LABEL = "Read integration readiness help";

export const CONNECTION_STATUS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "help-connection-status-workspace-readiness", title: CONNECTION_STATUS_HELP_READINESS_SECTION_TITLE },
  { level: 2, id: "what-connection-status-shows", title: "What connection status shows" },
  { level: 2, id: "connection-status-status-tags", title: CONNECTION_STATUS_HELP_STATUS_LEGEND_HEADING },
  { level: 2, id: "how-to-read-connection-status", title: "How connection status works" },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
