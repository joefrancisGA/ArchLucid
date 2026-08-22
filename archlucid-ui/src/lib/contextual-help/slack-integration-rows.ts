/** Slack integration surface and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

const SLACK_INTEGRATION_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Slack integration — configure incoming webhook destinations that receive alerts for this workspace.",
  whatToDoNext:
    "Add or test a Slack destination, then open Alert rules when you need to change which events fire notifications.",
  whyEmpty: "Destinations appear after you save an incoming webhook URL for this workspace.",
  whereToConfigurePrerequisite:
    "Creating or changing destinations requires a role that can manage alert routing.",
} as const;

export const SLACK_INTEGRATION_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/integrations/slack",
    entry: SLACK_INTEGRATION_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: "/help/slack-integration",
    entry: {
      whatIsThisPage:
        "Slack notifications — how incoming webhook destinations route alerts and when to open alert rules.",
      whatToDoNext:
        "Open Slack notifications to configure destinations, then follow alert rules when routing needs adjustment.",
      whyEmpty: "This guide is always available; destinations appear after you save a webhook URL.",
      whereToConfigurePrerequisite:
        "Integration readiness help covers procurement-oriented setup guidance across connector families.",
      whatToDoNextAction: {
        label: "Open Slack notifications",
        href: "/integrations/slack",
      },
      whereToConfigureAction: {
        label: "Read integration readiness help",
        href: inAppHelpHref("integration-readiness"),
      },
    },
  },
];
