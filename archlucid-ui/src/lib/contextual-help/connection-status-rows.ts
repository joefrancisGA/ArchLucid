/** Connection status hub and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { CONNECTION_STATUS_CANONICAL_PATH } from "@/lib/connection-status-evidence-copy";
import { CONNECTION_STATUS_HELP_CANONICAL_PATH } from "@/lib/connection-status-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

const CONNECTION_STATUS_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Connection status — which workspace integrations are configured, recommended, or need attention before reviews depend on them.",
  whatToDoNext:
    "Scan connector tiles, open the matching integration page when setup is incomplete, then open System health for runtime checks.",
  whyEmpty: "Tiles appear as connectors are discovered or configured for this workspace.",
  whereToConfigurePrerequisite:
    "Connector credentials and validation live on each integration surface — not on this readiness hub alone.",
  whatToDoNextAction: {
    label: "Open cloud connections",
    href: "/integrations/cloud-connections",
  },
  whereToConfigureAction: {
    label: "Open system health",
    href: "/administration/system-health",
  },
} as const;

export const CONNECTION_STATUS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: CONNECTION_STATUS_CANONICAL_PATH,
    entry: CONNECTION_STATUS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: CONNECTION_STATUS_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "Connection status — how readiness tiles are read, what configured vs recommended means, and when to open integration methodology help.",
      whatToDoNext: "Open connection status to review tiles, then follow connector pages or integration readiness help for setup work.",
      whyEmpty: "This guide is always available; tiles reflect connectors as they are configured.",
      whereToConfigurePrerequisite:
        "Integration readiness help covers procurement-oriented setup guidance across connector families.",
      whatToDoNextAction: {
        label: "Open connection status",
        href: CONNECTION_STATUS_CANONICAL_PATH,
      },
      whereToConfigureAction: {
        label: "Read integration readiness help",
        href: inAppHelpHref("integration-readiness"),
      },
    },
  },
];
