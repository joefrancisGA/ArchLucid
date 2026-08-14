import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  WEBHOOKS_INTEGRATION_CLAIM_DISCIPLINE,
  WEBHOOKS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/webhooks-integration-evidence-copy";

export const WEBHOOKS_INTEGRATION_HELP_CANONICAL_PATH = "/help/webhooks-integration" as const;

export const WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE =
  "This guide explains how HTTPS webhook subscriptions receive governance alerts — configure destination URLs, signing secrets, and event filters, then open Alert rules or Integration readiness when routing or procurement setup needs follow-up.";

export const WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const WEBHOOKS_INTEGRATION_HELP_SOURCES_INTRO = WEBHOOKS_INTEGRATION_SOURCES_INTRO;

/** Help follow-ups — no self-href to `/integrations/webhooks` or this help topic. */
export const WEBHOOKS_INTEGRATION_HELP_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Alert rules",
    href: GOVERNANCE_ALERT_RULES_PATH,
    when: "Change which governance events fire webhook deliveries",
  },
  {
    label: "Slack",
    href: "/integrations/slack",
    when: "Compare Slack routing when operators monitor both chat platforms",
  },
  {
    label: "Microsoft Teams",
    href: "/integrations/teams",
    when: "Compare Teams routing when operators monitor both chat platforms",
  },
  {
    label: "How alerts work",
    href: inAppHelpHref("alerts"),
    when: "Understand alert inbox behavior before changing routing rules",
  },
  {
    label: "Integration readiness help",
    href: inAppHelpHref("integration-readiness"),
    when: "Read procurement-oriented setup guidance when multiple connectors need attention",
  },
] as const;

export const WEBHOOKS_INTEGRATION_HELP_OPERATOR_CLAIM = WEBHOOKS_INTEGRATION_CLAIM_DISCIPLINE;
