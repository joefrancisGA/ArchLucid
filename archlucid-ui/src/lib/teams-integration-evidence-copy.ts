import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const TEAMS_INTEGRATION_CANONICAL_PATH = "/integrations/teams" as const;

export const TEAMS_INTEGRATION_CLAIM_DISCIPLINE =
  "Teams destinations route governance alerts to Microsoft Teams channels — they are not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Alert rules, Integration readiness, or Audit when you need operational or governed trails.";

export const TEAMS_INTEGRATION_SOURCES_INTRO =
  "Use these follow-ups when the Teams connector needs routing rules, readiness checks, or a sibling notification channel.";

export type TeamsIntegrationSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/integrations/teams`. */
export const TEAMS_INTEGRATION_SOURCES: readonly TeamsIntegrationSourceLink[] = [
  { label: "Alert rules", href: "/governance/alert-rules" },
  { label: "Integration readiness", href: INTEGRATIONS_READINESS_PATH },
  { label: "Slack", href: "/integrations/slack" },
  { label: "Audit", href: "/governance/audit" },
  { label: "How alerts work", href: inAppHelpHref("alerts") },
] as const;
