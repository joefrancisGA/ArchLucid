import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_ALERT_RULES_PATH, GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { TEAMS_INTEGRATION_SOURCES_INTRO } from "@/lib/teams-integration-evidence-copy";

export const TEAMS_INTEGRATION_HELP_CANONICAL_PATH = "/help/teams-integration" as const;

export const TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE =
  "This guide explains how Teams destinations route governance alerts — configure incoming webhooks, test delivery, then open Alert rules or Integration readiness when routing or procurement setup needs follow-up.";

export const TEAMS_INTEGRATION_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const TEAMS_INTEGRATION_HELP_SOURCES_INTRO = TEAMS_INTEGRATION_SOURCES_INTRO;

export const TEAMS_INTEGRATION_HELP_ALERT_RULES_HREF = GOVERNANCE_ALERT_RULES_PATH;

/** Help follow-ups — no self-href to `/integrations/teams`; one Alert rules destination. */
export const TEAMS_INTEGRATION_HELP_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Alert rules",
    href: GOVERNANCE_ALERT_RULES_PATH,
    when: "Change which governance events fire Teams notifications",
  },
  {
    label: "How alerts work",
    href: inAppHelpHref("alerts"),
    when: "Understand alert inbox behavior before changing routing rules",
  },
  {
    label: "Integration readiness",
    href: inAppHelpHref("integration-readiness"),
    when: "Review connector procurement and workspace readiness when Teams is one of several channels",
  },
  {
    label: "Audit",
    href: GOVERNANCE_AUDIT_PATH,
    when: "Follow official activity records when destination or routing changes need audit context",
  },
] as const;

export const TEAMS_INTEGRATION_HELP_ALTERNATIVES_TITLE = "Other chat routing options";

/** Sibling notification channels — help-to-help only, not live integration surfaces. */
export const TEAMS_INTEGRATION_HELP_ALTERNATIVE_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Slack integration help",
    href: inAppHelpHref("slack-integration"),
    when: "Compare Slack routing when operators monitor both chat platforms",
  },
  {
    label: "Webhooks integration help",
    href: inAppHelpHref("webhooks-integration"),
    when: "Route custom HTTP destinations when Teams is not the right channel",
  },
] as const;
