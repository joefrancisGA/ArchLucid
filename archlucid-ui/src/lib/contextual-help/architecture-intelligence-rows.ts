/** Architecture intelligence surface and its help topic. */



import type { PageContextualHelpRow } from "@/lib/contextual-help/types";

import {

  ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH,

  ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL,

} from "@/lib/architecture/architecture-intelligence-evidence-copy";

import { ARCHITECTURE_INTELLIGENCE_HELP_CANONICAL_PATH } from "@/lib/architecture-intelligence-help-evidence-copy";



const ARCHITECTURE_INTELLIGENCE_HUB_CONTEXTUAL_HELP = {

  whatIsThisPage:

    "Architecture intelligence - run closed-loop architecture reasoning or the golden regression harness against a free-form description, then publish findings into the workspace review trail when ready.",

  whatToDoNext:

    "Paste or edit a description, choose Run architecture reasoning or Run golden harness, then use Publish findings into review when the output is ready to attach as findings.",

  whyEmpty:

    "Results appear after a successful run; empty panels mean you have not submitted a description yet or the last run returned no structured output.",

  whereToConfigurePrerequisite:

    "Requires an authenticated Core API session and LLM/reasoning configuration for the tenant; sibling Start a review files evidence for a full review pipeline.",

  taskSteps: [
    "Paste or edit an architecture description for the run.",
    "Choose Run architecture reasoning or Run golden harness.",
    "Publish findings into review when output is ready to attach.",
  ],
} as const;



export const ARCHITECTURE_INTELLIGENCE_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [

  {

    prefix: ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH,

    entry: ARCHITECTURE_INTELLIGENCE_HUB_CONTEXTUAL_HELP,

  },

  {

    prefix: ARCHITECTURE_INTELLIGENCE_HELP_CANONICAL_PATH,

    entry: {

      whatIsThisPage: `Architecture intelligence — ${ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL.toLowerCase()} and when to publish findings or start a review.`,

      whatToDoNext:

        "Open architecture intelligence to run reasoning, then follow findings or review intake when output needs approval trails.",

      whyEmpty: "This guide is always available; reasoning results appear after you submit a description and run a check.",

      whereToConfigurePrerequisite:

        "Findings help covers triage when published output enters the findings queue.",

      whatToDoNextAction: {

        label: "Open architecture intelligence",

        href: ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH,

      },

      whereToConfigureAction: {

        label: "Read findings help",

        href: "/help/findings",

      },

    },

  },

];


