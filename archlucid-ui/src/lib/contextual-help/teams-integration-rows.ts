/** Microsoft Teams integration surface and its help topic. */



import type { PageContextualHelpRow } from "@/lib/contextual-help/types";

import { inAppHelpHref } from "@/lib/product-documentation-registry";



const TEAMS_INTEGRATION_HUB_CONTEXTUAL_HELP = {

  whatIsThisPage:

    "Microsoft Teams integration — configure a Teams channel destination that receives alerts for this workspace.",

  whatToDoNext:

    "Save or test the Teams connector, then open Alert rules when you need to change which events fire notifications.",

  whyEmpty: "Connection status appears after this workspace can load Teams notification settings.",

  whereToConfigurePrerequisite:

    "Creating or changing the Teams destination requires a role that can manage alert routing.",

  taskSteps: [

    "Save or update the Teams channel destination for this workspace.",

    "Send a test notification to confirm Teams delivery.",

    "Open Alert rules when you need to change which events fire.",

  ],

} as const;



export const TEAMS_INTEGRATION_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [

  {

    prefix: "/integrations/teams",

    entry: TEAMS_INTEGRATION_HUB_CONTEXTUAL_HELP,

  },

  {

    prefix: "/help/teams-integration",

    entry: {

      whatIsThisPage:

        "Teams notifications — how channel destinations route alerts and when to open alert rules.",

      whatToDoNext:

        "Open Teams notifications to configure the connector, then follow alert rules when routing needs adjustment.",

      whyEmpty: "This guide is always available; connection status loads after notification settings respond.",

      whereToConfigurePrerequisite:

        "Integration readiness help covers procurement-oriented setup guidance across connector families.",

      whatToDoNextAction: {

        label: "Open Teams notifications",

        href: "/integrations/teams",

      },

      whereToConfigureAction: {

        label: "Read integration readiness help",

        href: inAppHelpHref("integration-readiness"),

      },

    },

  },

];

