import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/webhooks-integration-help-evidence-copy";
import { WEBHOOKS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/webhooks-integration-evidence-copy";
import {
  WEBHOOKS_DELIVERY_CONTRACT_HEADING,
  WEBHOOKS_EVENTS_HELPER,
  WEBHOOKS_MUTATION_PREREQUISITE_NOTICE,
  WEBHOOKS_PAGE_TITLE,
  WEBHOOKS_SAVE_THEN_TEST_HELPER,
  WEBHOOKS_SIGNING_SECRET_HELPER,
  WEBHOOKS_TEST_FAILURE,
} from "@/lib/webhooks-page-copy";

export const WEBHOOKS_INTEGRATION_HELP_BREADCRUMB_TOPIC_TITLE = "Webhooks";

export const WEBHOOKS_INTEGRATION_HELP_PAGE_TITLE = WEBHOOKS_PAGE_TITLE;

export const WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE =
  "Orient on HTTPS webhook subscriptions — delivery contract, signature verification, and where to configure subscriptions.";

export const WEBHOOKS_INTEGRATION_HELP_OVERVIEW =
  "Webhooks let ArchLucid deliver governance alert events to HTTPS endpoints your team operates. Subscriptions are workspace-scoped routing configuration.";

export const WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION = {
  label: "Open webhooks",
  href: "/integrations/webhooks",
} as const;

export const WEBHOOKS_INTEGRATION_HELP_MUTATION_PREREQUISITE_NOTICE = WEBHOOKS_MUTATION_PREREQUISITE_NOTICE;

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
  `Open Integration readiness to review connection status and outbound delivery prerequisites when a test event reports "${WEBHOOKS_TEST_FAILURE}"`,
] as const;

export const WEBHOOKS_INTEGRATION_HELP_ALERT_RULES_HREF = "/governance/alert-rules";

export const WEBHOOKS_INTEGRATION_HELP_READINESS_HREF = INTEGRATIONS_READINESS_PATH;

export const WEBHOOKS_INTEGRATION_HELP_CLAIM_HEADING_ID = "help-webhooks-integration-claim-discipline-heading" as const;

export const WEBHOOKS_INTEGRATION_HELP_DELIVERY_SECTION_ID = "delivery-and-signature-verification" as const;

export const WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-webhooks-do", title: "What webhooks do" },
  { level: 2, id: WEBHOOKS_INTEGRATION_HELP_DELIVERY_SECTION_ID, title: WEBHOOKS_DELIVERY_CONTRACT_HEADING },
  { level: 2, id: "how-webhooks-work", title: WEBHOOKS_INTEGRATION_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: WEBHOOKS_INTEGRATION_HELP_CLAIM_HEADING_ID,
    title: WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: claim band owns diligence limits; overview and steps stay affirmative. */
export const WEBHOOKS_INTEGRATION_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: ["not a sealed-review diligence package", "not a diligence package"],
  claimMustNotContain: ["sources package", "sealed-review diligence"],
} as const;
