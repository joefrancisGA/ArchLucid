import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import {
  SLACK_INTEGRATION_SOURCES_INTRO,
} from "@/lib/slack-integration-evidence-copy";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { GOVERNANCE_ALERT_RULES_PATH, GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const SLACK_INTEGRATION_HELP_CANONICAL_PATH = "/help/slack-integration" as const;

export const SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE =
  "This guide explains Slack incoming-webhook destinations for governance alerts. It does not cover Slack app installation or workspace admin, per-channel Slack permissions, delivery retry guarantees, or which governance events fire — those live on Alert rules and in Slack admin.";

export const SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const SLACK_INTEGRATION_HELP_SOURCES_INTRO = SLACK_INTEGRATION_SOURCES_INTRO;

/** Help follow-ups — no self-href to `/integrations/slack`; one Alert rules destination. */
export const SLACK_INTEGRATION_HELP_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Alert rules",
    href: GOVERNANCE_ALERT_RULES_PATH,
    when: "Change which governance events fire Slack notifications",
  },
  {
    label: "Integration readiness",
    href: INTEGRATIONS_READINESS_PATH,
    when: "Read procurement-oriented setup guidance when multiple connectors need attention",
  },
  {
    label: "Microsoft Teams",
    href: "/integrations/teams",
    when: "Compare Teams routing when operators monitor both chat platforms",
  },
  {
    label: "Audit",
    href: GOVERNANCE_AUDIT_PATH,
    when: "Follow official activity records when destination or routing changes need audit context",
  },
  {
    label: "How alerts work",
    href: inAppHelpHref("alerts"),
    when: "Understand alert inbox behavior before changing routing rules",
  },
  {
    label: "Security and trust help",
    href: inAppHelpHref("security-trust"),
    when: "Read how ArchLucid stores webhook credentials and tenant isolation posture",
  },
] as const;
