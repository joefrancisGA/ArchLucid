/** Baseline settings hub and its help topic. */



import type { PageContextualHelpRow } from "@/lib/contextual-help/types";

import { BASELINE_SETTINGS_HELP_CANONICAL_PATH } from "@/lib/baseline-settings-help-evidence-copy";

import { inAppHelpHref } from "@/lib/product-documentation-registry";



const BASELINE_SETTINGS_HUB_CONTEXTUAL_HELP = {

  whatIsThisPage:

    "Baseline settings - capture ROI measurement anchors (review cycle hours, prep time, people per review) for this workspace.",

  whatToDoNext:

    "Save or clear baseline anchors, then open Pilot ROI model help or Architecture scorecard when numbers need methodology.",

  whyEmpty:

    "Fields load after tenant baseline API responds; empty values mean conservative defaults until you save anchors.",

  whereToConfigurePrerequisite:

    "Saving baseline anchors needs Execute authority in this workspace.",

  taskSteps: [

    "Enter review cycle hours, prep time, and people per review.",

    "Save anchors when assumptions are ready for ROI surfaces.",

    "Open Architecture scorecard or ROI summary to review directional estimates.",

  ],

} as const;



export const BASELINE_SETTINGS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [

  {

    prefix: "/administration/baseline",

    entry: BASELINE_SETTINGS_HUB_CONTEXTUAL_HELP,

  },

  {

    prefix: BASELINE_SETTINGS_HELP_CANONICAL_PATH,

    entry: {

      whatIsThisPage:

        "Baseline settings — how ROI measurement anchors are captured, what fields mean, and how they feed scorecard and ROI surfaces.",

      whatToDoNext:

        "Open baseline settings to save anchors, then follow methodology help when assumptions need drill-down.",

      whyEmpty: "This guide is always available; anchor fields load after the tenant baseline API responds.",

      whereToConfigurePrerequisite:

        "ROI summary help explains how portfolio savings framing uses these anchors.",

      whatToDoNextAction: {

        label: "Open baseline settings",

        href: "/administration/baseline",

      },

      whereToConfigureAction: {

        label: "Read ROI summary help",

        href: inAppHelpHref("roi-summary"),

      },

    },

  },

];

