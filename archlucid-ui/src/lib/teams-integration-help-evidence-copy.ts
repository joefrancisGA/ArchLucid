import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { GOVERNANCE_ALERT_RULES_PATH, GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { TEAMS_INTEGRATION_SOURCES_INTRO } from "@/lib/teams-integration-evidence-copy";

export const TEAMS_INTEGRATION_HELP_CANONICAL_PATH = "/help/teams-integration" as const;

export const TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE =
  "This guide explains how Teams destinations route governance alerts — configure incoming webhooks, test delivery, then open Alert rules or Integration readiness when routing or procurement setup needs follow-up.";

export const TEAMS_INTEGRATION_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const TEAMS_INTEGRATION_HELP_SOURCES_INTRO = TEAMS_INTEGRATION_SOURCES_INTRO;

/** Help follow-ups — no self-href to `/integrations/teams`; one Alert rules destination. */
export const TEAMS_INTEGRATION_HELP_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Alert rules",
    href: GOVERNANCE_ALERT_RULES_PATH,
    when: "Change which governance events fire Teams notifications",
  },
  {
    label: "Integration readiness",
    href: INTEGRATIONS_READINESS_PATH,
    when: "Read procurement-oriented setup guidance when multiple connectors need attention",
  },
  {
    label: "Slack",
    href: "/integrations/slack",
    when: "Compare Slack routing when operators monitor both chat platforms",
  },
  {
    label: "Webhooks",
    href: "/integrations/webhooks",
    when: "Route custom HTTP destinations when Teams is not the right channel",
  },
  {
    label: "How alerts work",
    href: inAppHelpHref("alerts"),
    when: "Understand alert inbox behavior before changing routing rules",
  },
  {
    label: "Audit",
    href: GOVERNANCE_AUDIT_PATH,
    when: "Follow governed activity when destination or routing changes need audit context",
  },
] as const;
