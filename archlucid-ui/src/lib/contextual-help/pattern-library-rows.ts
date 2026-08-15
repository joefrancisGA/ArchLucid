/** Pattern library surface and repeat-review-loop help topic (TB-1814). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import {
  PATTERN_LIBRARY_CANONICAL_PATH,
  PATTERN_LIBRARY_HELP_TOPIC_LABEL,
} from "@/lib/pattern-library-evidence-copy";
import { REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL } from "@/lib/repeat-review-loop-help-title-honesty-surfaces";

const PATTERN_LIBRARY_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Browse anonymized architecture patterns with adoption, risk, and governance signals from thresholded aggregates.",
  whatToDoNext:
    "Filter the catalog, open a pattern detail, or start a review when a pattern fits your next change.",
  whyEmpty:
    "Patterns appear when anonymized aggregates meet privacy thresholds, or when sample catalog data is shown.",
  whereToConfigurePrerequisite:
    "Live aggregates need enough finalized reviews across anonymized tenants to meet the privacy threshold.",
  whatToDoNextAction: {
    label: "Start a review",
    href: REVIEWS_NEW_PATH,
  },
} as const;

export const PATTERN_LIBRARY_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: PATTERN_LIBRARY_CANONICAL_PATH,
    entry: PATTERN_LIBRARY_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: "/help/repeat-review-loop",
    entry: {
      whatIsThisPage:
        `${REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL} — ${PATTERN_LIBRARY_HELP_TOPIC_LABEL.toLowerCase()} and follow-up review proof after the first finalize.`,
      whatToDoNext:
        "Open Compare two reviews, start the next review, or Validate review when you need live package trails.",
      whyEmpty: "This guide is always available; compare and replay surfaces populate after finalized reviews exist.",
      whereToConfigurePrerequisite:
        "Follow-up review workflows need at least one finalized architecture review in this workspace.",
      whatToDoNextAction: {
        label: "Open pattern library",
        href: PATTERN_LIBRARY_CANONICAL_PATH,
      },
      whereToConfigureAction: {
        label: "Open Compare two reviews",
        href: "/insights/compare-two-reviews",
      },
    },
  },
];
