/** Ask review questions surface and prior-manifest retrieval help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { ASK_REVIEW_QUESTIONS_CANONICAL_PATH } from "@/lib/ask-review-questions-evidence-copy";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_CANONICAL_PATH,
  PRIOR_MANIFEST_RETRIEVAL_HELP_TOPIC_LABEL,
} from "@/lib/prior-manifest-retrieval-help-evidence-copy";
import { PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS } from "@/lib/prior-manifest-retrieval-help-guide-content";

const ASK_REVIEW_QUESTIONS_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Ask plain-language questions about a finalized review; answers use the sealed record and cite findings when available.",
  whatToDoNext:
    "Select a review, ask about risk or evidence, then open cited findings or the evidence trail under the answer.",
  whyEmpty: "Threads appear after you ask a question against a selected review.",
  whereToConfigurePrerequisite: "Finalize or open a review so Ask can ground answers in its evidence.",
} as const;

export const PRIOR_MANIFEST_RETRIEVAL_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: ASK_REVIEW_QUESTIONS_CANONICAL_PATH,
    entry: ASK_REVIEW_QUESTIONS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: PRIOR_MANIFEST_RETRIEVAL_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: PRIOR_MANIFEST_RETRIEVAL_HELP_TOPIC_LABEL,
      whatToDoNext:
        "Open Ask review questions to ground answers in a selected sealed record, then follow cited findings or search.",
      whyEmpty: "This guide is always available; Ask threads appear after you select a review and ask a question.",
      whereToConfigurePrerequisite:
        "Search review evidence help covers workspace-wide retrieval when you do not need conversational answers.",
      whatToDoNextAction: {
        label: PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS.openAsk.label,
        href: PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS.openAsk.href,
      },
      whereToConfigureAction: {
        label: "Read search review evidence help",
        href: "/help/search-review-evidence",
      },
    },
  },
];
