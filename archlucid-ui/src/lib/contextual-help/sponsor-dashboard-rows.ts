/** Sponsor dashboard surface and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  ARCHITECTURE_SPONSOR_DASHBOARD_CANONICAL_PATH,
  SPONSOR_DASHBOARD_HELP_TOPIC_LABEL,
} from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import { SPONSOR_DASHBOARD_HELP_CANONICAL_PATH } from "@/lib/sponsor-dashboard-help-evidence-copy";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

const SPONSOR_DASHBOARD_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Sponsor dashboard — portfolio ROI trends, sponsor exports, and workspace-health KPI tiles for approval and ROI status in the current scope.",
  whatToDoNext:
    "Review KPI tiles and sponsor exports, then open Workspace health or Decisions needed for approval follow-up.",
  whyEmpty:
    "Tiles stay at zero until you finalize reviews and approval activity exists in the current workspace scope.",
  whereToConfigurePrerequisite:
    "Switch workspace or project scope from the header switcher — figures never roll up across workspaces.",
  whatToDoNextAction: {
    label: "Open approval queue",
    href: GOVERNANCE_APPROVAL_QUEUE_PATH,
  },
  taskSteps: [
    "Review KPI tiles and sponsor exports for the current scope.",
    "Open Decisions needed when approvals are blocking progress.",
    "Switch workspace or project from the header when figures look stale.",
  ],
} as const;

export const SPONSOR_DASHBOARD_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: ARCHITECTURE_SPONSOR_DASHBOARD_CANONICAL_PATH,
    entry: SPONSOR_DASHBOARD_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: SPONSOR_DASHBOARD_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Sponsor dashboard — ${SPONSOR_DASHBOARD_HELP_TOPIC_LABEL.toLowerCase()} and when to open sponsor exports or sponsor report help.`,
      whatToDoNext:
        "Open the sponsor dashboard to review KPI tiles, then follow sponsor report or scorecard help when briefing sponsors.",
      whyEmpty: "This guide is always available; KPI tiles populate after finalized reviews exist in scope.",
      whereToConfigurePrerequisite:
        "Sponsor report help covers period narratives and sponsor export methodology.",
      whatToDoNextAction: {
        label: "Open sponsor dashboard",
        href: ARCHITECTURE_SPONSOR_DASHBOARD_CANONICAL_PATH,
      },
      whereToConfigureAction: {
        label: "Read sponsor report help",
        href: "/help/sponsor-report",
      },
    },
  },
];
