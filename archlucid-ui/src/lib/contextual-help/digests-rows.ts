/** Architecture digests hub, its legacy aliases, and the digests help topic. */

import type { PageContextualHelpEntry, PageContextualHelpRow } from "@/lib/contextual-help/types";
import { DIGESTS_HELP_CANONICAL_PATH, DIGESTS_HELP_TOPIC_LABEL } from "@/lib/digests-help-evidence-copy";
import {
  DIGESTS_HUB_PATH,
  DIGESTS_SCHEDULE_TAB_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
  LEGACY_DIGEST_SUBSCRIPTIONS_PATH,
  LEGACY_DIGESTS_HUB_PATH,
} from "@/lib/digests-route-paths";

const DIGESTS_HUB_CONTEXTUAL_HELP: PageContextualHelpEntry = {
  whatIsThisPage:
    "Send scheduled summaries of review activity, approval signals, findings, and advisory scans.",
  whatToDoNext: "Open the schedule tab to set timing and recipients, then preview or send a test digest.",
  whyEmpty: "Generated digests appear here after a schedule and recipients are configured.",
  whereToConfigurePrerequisite:
    "Recipient subscriptions and sponsor rollup settings live on the schedule tab.",
  whatToDoNextAction: {
    label: "Open schedule tab",
    href: DIGESTS_SCHEDULE_TAB_PATH,
  },
  whereToConfigureAction: {
    label: "Open schedule tab",
    href: DIGESTS_SCHEDULE_TAB_PATH,
  },
  taskSteps: [
    "Open the schedule tab to set cadence and recipients.",
    "Preview or send a test digest before enabling production delivery.",
    "Manage subscriptions on the subscriptions tab when destinations change.",
  ],
};

export const DIGESTS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: DIGESTS_HUB_PATH,
    entry: DIGESTS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: LEGACY_DIGESTS_HUB_PATH,
    entry: DIGESTS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: LEGACY_DIGEST_SUBSCRIPTIONS_PATH,
    entry: DIGESTS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: DIGESTS_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Architecture digests — ${DIGESTS_HELP_TOPIC_LABEL.toLowerCase()} for scheduled summaries, delivery, and browsing.`,
      whatToDoNext: "Open the digests hub schedule tab to set cadence and recipients, then manage subscriptions.",
      whyEmpty: "This guide is always available; generated digests appear after schedule and recipients are configured.",
      whereToConfigurePrerequisite:
        "Cadence and recipients live on digests schedule; destinations live on subscriptions.",
      whatToDoNextAction: {
        label: "Open schedule tab",
        href: DIGESTS_SCHEDULE_TAB_PATH,
      },
      whereToConfigureAction: {
        label: "Open subscriptions tab",
        href: DIGESTS_SUBSCRIPTIONS_TAB_PATH,
      },
    },
  },
];
