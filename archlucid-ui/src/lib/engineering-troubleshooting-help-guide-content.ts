import { DEVELOPER_TROUBLESHOOTING_HELP_PATH } from "@/lib/developer-troubleshooting-help-route";
import type { FindingSeverityKind } from "@/lib/design-tokens";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ENGINEERING_TROUBLESHOOTING_HELP_PAGE_TITLE = "Engineering troubleshooting runbook";

export const ENGINEERING_TROUBLESHOOTING_HELP_PAGE_SUBTITLE =
  "Admin-only CLI, environment, and diagnostic-signal triage for engineering support. Use customer Troubleshooting for operator self-serve.";

export const ENGINEERING_TROUBLESHOOTING_HELP_OVERVIEW =
  "Use this runbook when you need eng-depth failure signatures after customer Troubleshooting and System health. It is not a sponsor diligence pack.";

export const ENGINEERING_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE =
  "This Admin eng runbook is operational triage evidence for support engineers — not customer self-serve help and not certification.";

export const ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_TITLE = "Symptom lookup";

export const ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_FILTER_LABEL = "Filter symptoms";

export const ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_TITLE = "Sources";

export const ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_INTRO =
  "Merged from upstream engineering runbooks in the repository.";

export const ENGINEERING_TROUBLESHOOTING_HELP_ACTION_PANEL_TITLE = "Prefer customer paths first";

export const ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS = {
  openCustomerTroubleshooting: {
    label: "Customer Troubleshooting",
    href: inAppHelpHref("troubleshooting"),
  },
  openSystemHealth: {
    label: "System health",
    href: "/administration/system-health",
  },
  openReportAProblem: {
    label: "Report a problem",
    href: inAppHelpHref("report-a-problem"),
  },
  openCliUsage: {
    label: "CLI usage",
    href: inAppHelpHref("cli-usage"),
  },
} as const;

export type EngineeringTroubleshootingHelpSymptomRow = {
  readonly symptom: string;
  readonly firstCheck: string;
  readonly escalationArtifact: string;
  readonly severity: FindingSeverityKind;
};

export const ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_ROWS: readonly EngineeringTroubleshootingHelpSymptomRow[] =
  [
    {
      symptom: "API does not start (migration / DbUp)",
      firstCheck: "Fix ConnectionStrings:ArchLucid and confirm SQL is reachable.",
      escalationArtifact: "Startup diagnostic signal + migration error detail",
      severity: "critical",
    },
    {
      symptom: "/health/ready returns 503",
      firstCheck: "Read JSON entries[] for the first Unhealthy or Degraded check.",
      escalationArtifact: "support-bundle --zip",
      severity: "high",
    },
    {
      symptom: "401 / 403 on API",
      firstCheck: "Confirm auth mode and JWT roles map to Reader, Operator, or Admin.",
      escalationArtifact: "API contracts security section",
      severity: "medium",
    },
    {
      symptom: "429 Too Many Requests",
      firstCheck: "Wait for the rate-limit window or adjust RateLimiting settings (non-production).",
      escalationArtifact: "Rate limit configuration reference",
      severity: "low",
    },
    {
      symptom: "404 on review or signed review record",
      firstCheck: "Verify review ID and tenant / workspace / project scope headers.",
      escalationArtifact: "Re-fetch review in the architect workspace",
      severity: "medium",
    },
    {
      symptom: "409 on commit",
      firstCheck: "Follow the conflict message; re-fetch run status before retrying.",
      escalationArtifact: "Fresh architecture review attempt",
      severity: "medium",
    },
    {
      symptom: "UI shows 503 invalid upstream API configuration",
      firstCheck: "Set ARCHLUCID_API_BASE_URL in archlucid-ui/.env.local and restart dev.",
      escalationArtifact: "Next server proxy diagnostic signal",
      severity: "high",
    },
    {
      symptom: "UI loads but API calls fail",
      firstCheck: "Inspect browser network tab and Next archlucid-ui-proxy warnings.",
      escalationArtifact: "HAR + correlationId from problem JSON",
      severity: "high",
    },
    {
      symptom: "run --quick / execute LLM or timeout errors",
      firstCheck: "Prefer simulator mode for pilots; validate AgentExecution / Azure OpenAI config.",
      escalationArtifact: "Resilience configuration + circuit breaker state",
      severity: "high",
    },
    {
      symptom: ".NET tests fail with SQL errors",
      firstCheck: "Set ARCHLUCID_SQL_TEST or run fast core tests only.",
      escalationArtifact: "Build guide SQL prerequisites",
      severity: "low",
    },
  ] as const;

export type EngineeringTroubleshootingHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Admin Sources — no self-href to this eng runbook. */
export const ENGINEERING_TROUBLESHOOTING_HELP_SOURCES: readonly EngineeringTroubleshootingHelpSourceLink[] =
  [
    { label: "Customer Troubleshooting", href: inAppHelpHref("troubleshooting") },
    { label: "Admin diagnostics", href: inAppHelpHref("admin-diagnostics") },
    { label: "CLI usage", href: inAppHelpHref("cli-usage") },
    { label: "Configuration reference", href: inAppHelpHref("configuration-reference") },
    { label: "Report a problem", href: inAppHelpHref("report-a-problem") },
    { label: "System health", href: "/administration/system-health" },
  ] as const;

export const ENGINEERING_TROUBLESHOOTING_HELP_CANONICAL_PATH = DEVELOPER_TROUBLESHOOTING_HELP_PATH;
