/** System health surface and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { SYSTEM_HEALTH_CANONICAL_PATH, SYSTEM_HEALTH_HELP_TOPIC_LABEL } from "@/lib/system-health-evidence-copy";
import { SYSTEM_HEALTH_HELP_CANONICAL_PATH } from "@/lib/system-health-help-evidence-copy";

const SYSTEM_HEALTH_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "System health — workspace service health, required dependencies, and deployment identity for this tenant.",
  whatToDoNext:
    "Refresh readiness, then open Connection status when a dependency needs follow-up.",
  whyEmpty: "Health rows appear after the readiness probe returns for this workspace.",
  whereToConfigurePrerequisite:
    "Dependency connectivity is configured under Administration → Connection status.",
  whatToDoNextAction: {
    label: "Open Connection status",
    href: "/administration/connection-status",
  },
  whereToConfigureAction: {
    label: "Open Connection status",
    href: "/administration/connection-status",
  },
  taskSteps: [
    "Refresh readiness to load the latest dependency checks.",
    "Open Connection status when a connector needs configuration.",
    "Follow troubleshooting help when a dependency stays unhealthy.",
  ],
} as const;

export const SYSTEM_HEALTH_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: SYSTEM_HEALTH_CANONICAL_PATH,
    entry: SYSTEM_HEALTH_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: SYSTEM_HEALTH_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `System health — ${SYSTEM_HEALTH_HELP_TOPIC_LABEL.toLowerCase()} and when to open connection status or troubleshooting help.`,
      whatToDoNext:
        "Open system health to review readiness rows, then follow connection status or troubleshooting help for follow-up work.",
      whyEmpty: "This guide is always available; health rows load after the readiness probe responds.",
      whereToConfigurePrerequisite:
        "Connection status help covers integration readiness tiles across connector families.",
      whatToDoNextAction: {
        label: "Open system health",
        href: SYSTEM_HEALTH_CANONICAL_PATH,
      },
      whereToConfigureAction: {
        label: "Read troubleshooting help",
        href: "/help/troubleshooting",
      },
    },
  },
];
