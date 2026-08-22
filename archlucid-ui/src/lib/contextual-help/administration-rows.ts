/** Administration hub routes (`/administration/**`) — developer tools only; workspace settings live in workspace-administration-rows. */

import type { PageContextualHelpEntry, PageContextualHelpRow } from "@/lib/contextual-help/types";

/** Exact Settings hub root (`/administration`) — registered via parameterized matcher so children keep their own answers. */
export const SETTINGS_HUB_HELP_TOPIC_LABEL = "Settings help" as const;

export const SETTINGS_HUB_CONTEXTUAL_HELP: PageContextualHelpEntry = {
  whatIsThisPage:
    "Settings hub — search and open workspace, governance, integration, security, billing, and support configuration pages.",
  whatToDoNext:
    "Search or jump to a section, then open a destination page to change settings. Use the help control for short answers about this index.",
  whyEmpty:
    "Sections appear based on your authority and search; try clearing search or showing advanced settings when a destination is missing.",
  whereToConfigurePrerequisite:
    "Some destinations require Admin or Operator authority; personal preferences stay in the account menu.",
  taskSteps: [
    "Search or browse sections to find the settings destination you need.",
    "Open a destination page to change workspace, integration, or security settings.",
    "Use advanced settings when a card is hidden by default search filters.",
  ],
};

export const ADMINISTRATION_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/administration/developer",
    entry: {
      whatIsThisPage:
        "Internal developer tools - evaluate branded themes and try CLI demos for workspace diagnostics; not part of the customer settings navigation.",
      whatToDoNext:
        "Use the theme selector for visual evaluation, try the CLI demo card when validating local tooling, then open Engineering troubleshooting or System health for live runbooks.",
      whyEmpty:
        "Theme and CLI cards always render for authorized architects; empty results only appear inside the CLI demo after a command returns no output.",
      whereToConfigurePrerequisite:
        "Requires an authenticated Admin session with advanced/developer route access; customer settings hubs do not deep-link here.",
    },
  },
];
