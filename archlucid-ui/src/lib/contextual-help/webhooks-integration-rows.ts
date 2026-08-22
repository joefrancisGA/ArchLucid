/** Webhooks integration surface and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

const WEBHOOKS_INTEGRATION_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Webhooks — configure HTTPS webhook subscriptions that receive alerts for this workspace.",
  whatToDoNext:
    "Add or test a subscription, then open Alert rules when you need to change which events fire notifications.",
  whyEmpty: "Subscriptions appear after you save a webhook URL for this workspace.",
  whereToConfigurePrerequisite:
    "Creating or changing subscriptions requires a role that can manage alert routing.",
} as const;

export const WEBHOOKS_INTEGRATION_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/integrations/webhooks",
    entry: WEBHOOKS_INTEGRATION_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: "/help/webhooks-integration",
    entry: {
      whatIsThisPage:
        "Webhooks — how HTTPS subscriptions receive alerts and when to open alert rules.",
      whatToDoNext:
        "Open webhooks to configure subscriptions, then follow alert rules when routing needs adjustment.",
      whyEmpty: "This guide is always available; subscriptions appear after you save a webhook URL.",
      whereToConfigurePrerequisite:
        "Integration readiness help covers procurement-oriented setup guidance across connector families.",
      whatToDoNextAction: {
        label: "Open webhooks",
        href: "/integrations/webhooks",
      },
      whereToConfigureAction: {
        label: "Read integration readiness help",
        href: inAppHelpHref("integration-readiness"),
      },
    },
  },
];
