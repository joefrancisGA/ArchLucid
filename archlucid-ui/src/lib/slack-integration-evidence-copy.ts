import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const SLACK_INTEGRATION_CANONICAL_PATH = "/integrations/slack" as const;

export const SLACK_INTEGRATION_CLAIM_DISCIPLINE =
  "Slack destinations route governance alerts to incoming webhooks — they are not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Alert rules, Integration readiness, or Audit when you need operational or governed trails.";

export const SLACK_INTEGRATION_SOURCES_INTRO =
  "Use these follow-ups when destinations need routing rules, readiness checks, or a sibling notification channel.";

export type SlackIntegrationSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/integrations/slack`. */
export const SLACK_INTEGRATION_SOURCES: readonly SlackIntegrationSourceLink[] = [
  { label: "Alert rules", href: "/governance/alert-rules" },
  { label: "Integration readiness", href: INTEGRATIONS_READINESS_PATH },
  { label: "Microsoft Teams", href: "/integrations/teams" },
  { label: "Audit", href: "/governance/audit" },
  { label: "How alerts work", href: inAppHelpHref("alerts") },
] as const;
