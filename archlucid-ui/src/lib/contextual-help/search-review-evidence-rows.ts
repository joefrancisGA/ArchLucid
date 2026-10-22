/** Search review evidence surface and its help topic. */



import type { PageContextualHelpRow } from "@/lib/contextual-help/types";

import {

  SEARCH_REVIEW_EVIDENCE_CANONICAL_PATH,

  SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL,

} from "@/lib/search-review-evidence-evidence-copy";

import { SEARCH_REVIEW_EVIDENCE_HELP_CANONICAL_PATH } from "@/lib/search-review-evidence-help-evidence-copy";



const SEARCH_REVIEW_EVIDENCE_HUB_CONTEXTUAL_HELP = {

  whatIsThisPage:

    "Search findings, decisions, and finalized review evidence across the workspace index, optionally scoped to one review.",

  whatToDoNext:

    "Enter a phrase, optionally limit to a review, then open the hit, Evidence trail, or Sources cites before briefing.",

  whyEmpty: "Matches appear after committed review evidence is indexed and your query finds relevant chunks.",

  whereToConfigurePrerequisite: "Finalize reviews so findings and finalized review records are available to search.",

  taskSteps: [

    "Enter a phrase and optionally limit results to one review.",

    "Open a hit to read the supporting evidence chunk.",

    "Follow Evidence trail or Sources before briefing sponsors.",

  ],

} as const;



export const SEARCH_REVIEW_EVIDENCE_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [

  {

    prefix: SEARCH_REVIEW_EVIDENCE_CANONICAL_PATH,

    entry: SEARCH_REVIEW_EVIDENCE_HUB_CONTEXTUAL_HELP,

  },

  {

    prefix: SEARCH_REVIEW_EVIDENCE_HELP_CANONICAL_PATH,

    entry: {

      whatIsThisPage: `Search review evidence — ${SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL.toLowerCase()} and when to open evidence graph or findings.`,

      whatToDoNext:

        "Open search to run a query, then follow evidence graph or Ask when hits need relationship or narrative context.",

      whyEmpty: "This guide is always available; search hits appear after finalized reviews are indexed.",

      whereToConfigurePrerequisite:

        "Evidence graph help covers node relationships for a selected finalized review.",

      whatToDoNextAction: {

        label: "Open search review evidence",

        href: SEARCH_REVIEW_EVIDENCE_CANONICAL_PATH,

      },

      whereToConfigureAction: {

        label: "Read evidence graph help",

        href: "/help/evidence-graph",

      },

    },

  },

];


