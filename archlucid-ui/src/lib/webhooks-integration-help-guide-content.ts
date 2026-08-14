import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { WEBHOOKS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/webhooks-integration-evidence-copy";
import {
  WEBHOOKS_EVENTS_HELPER,
  WEBHOOKS_PAGE_DESCRIPTION,
  WEBHOOKS_PAGE_TITLE,
  WEBHOOKS_SAVE_THEN_TEST_HELPER,
  WEBHOOKS_SIGNING_SECRET_HELPER,
} from "@/lib/webhooks-page-copy";

export const WEBHOOKS_INTEGRATION_HELP_PAGE_TITLE = WEBHOOKS_PAGE_TITLE;

export const WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE = WEBHOOKS_PAGE_DESCRIPTION;

export const WEBHOOKS_INTEGRATION_HELP_OVERVIEW =
  "Webhooks let ArchLucid deliver governance alert events to HTTPS endpoints your team operates. Subscriptions are workspace-scoped routing configuration — not a sealed-review diligence package.";

export const WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION = {
  label: "Open webhooks",
  href: "/integrations/webhooks",
} as const;

export type WebhooksIntegrationHelpItem = {
  readonly label: string;
  readonly detail: string;
};

export const WEBHOOKS_INTEGRATION_HELP_FEATURE_ITEMS: readonly WebhooksIntegrationHelpItem[] = [
  {
    label: "HTTPS destinations",
    detail: "Each subscription posts selected alert events to an HTTPS URL reachable from ArchLucid.",
  },
  {
    label: "Signing secrets",
    detail: WEBHOOKS_SIGNING_SECRET_HELPER,
  },
  {
    label: "Event filters",
    detail: WEBHOOKS_EVENTS_HELPER,
  },
  {
    label: "Test before save",
    detail: WEBHOOKS_SAVE_THEN_TEST_HELPER,
  },
] as const;

export const WEBHOOKS_INTEGRATION_HELP_HOW_TO_READ_STEPS = [
  "Add a subscription with destination URL, signing secret, and event filters.",
  "Send a successful test delivery before saving when the form requires it.",
  "Open Alert rules when deliveries succeed but the wrong governance events fire.",
] as const;

export const WEBHOOKS_INTEGRATION_HELP_ALERT_RULES_HREF = "/governance/alert-rules";

export const WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-webhooks-do", title: "What webhooks do" },
  { level: 2, id: "how-webhooks-work", title: WEBHOOKS_INTEGRATION_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
