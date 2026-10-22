/** API keys settings surface and its help topic. */



import type { PageContextualHelpRow } from "@/lib/contextual-help/types";

import { API_KEYS_HELP_CANONICAL_PATH } from "@/lib/api-keys-help-evidence-copy";

import { inAppHelpHref } from "@/lib/product-documentation-registry";



const API_KEYS_HUB_CONTEXTUAL_HELP = {

  whatIsThisPage:

    "API keys — workspace automation credential controls when in-product management is enabled for your workspace.",

  whatToDoNext:

    "Use Users and roles for people access. Host automation credentials are documented in CLI usage help.",

  whyEmpty:

    "In-product API key management is not available in this workspace UI.",

  whereToConfigurePrerequisite:

    "Workspace Admin authority is required when the surface is enabled; some tenants use SSO-only sign-in without API keys.",

  taskSteps: [

    "Confirm whether in-product API key management is enabled here.",

    "Use Users and roles for people access instead of automation keys.",

    "Follow CLI usage help when host automation credentials are required.",

  ],

} as const;



export const API_KEYS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [

  {

    prefix: "/administration/api-keys",

    entry: API_KEYS_HUB_CONTEXTUAL_HELP,

  },

  {

    prefix: API_KEYS_HELP_CANONICAL_PATH,

    entry: {

      whatIsThisPage:

        "API keys — how workspace automation credentials are rotated, when the surface is available, and how keys differ from people access.",

      whatToDoNext:

        "Open API keys when in-product management is enabled, then follow CLI usage or users and roles help for related questions.",

      whyEmpty: "This guide is always available; in-product key management depends on workspace configuration.",

      whereToConfigurePrerequisite:

        "CLI usage help documents host automation credentials when the settings surface is unavailable.",

      whatToDoNextAction: {

        label: "Open API keys",

        href: "/administration/api-keys",

      },

      whereToConfigureAction: {

        label: "Read CLI usage help",

        href: inAppHelpHref("cli-usage"),

      },

    },

  },

];

