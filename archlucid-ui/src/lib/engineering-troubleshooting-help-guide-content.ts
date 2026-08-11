import { ENGINEERING_TROUBLESHOOTING_HELP_PATH } from "@/lib/developer-troubleshooting-help-route";
import type { FindingSeverityKind } from "@/lib/design-tokens";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ENGINEERING_TROUBLESHOOTING_HELP_PAGE_TITLE = "Engineering troubleshooting runbook";

export const ENGINEERING_TROUBLESHOOTING_HELP_PAGE_SUBTITLE =
  "Admin-only CLI, environment, and diagnostic-signal triage for engineering support. Use customer Troubleshooting for operator self-serve.";

export const ENGINEERING_TROUBLESHOOTING_HELP_OVERVIEW =
  "Use this runbook when you need eng-depth failure signatures after customer Troubleshooting and System health. It is not a sponsor diligence pack.";

export const ENGINEERING_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE =
  "Operational triage evidence for engineering support — not customer self-serve help and not certification.";

export const ENGINEERING_TROUBLESHOOTING_HELP_AUDIENCE_STRIP_TITLE = "Admin engineering scope";

export const ENGINEERING_TROUBLESHOOTING_HELP_AUDIENCE_STRIP_BODY =
  "After customer Troubleshooting and System health, use this runbook for CLI, migration, proxy, and auth-depth triage. It is not customer self-serve help and not certification.";

export const ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_TITLE = "Symptom lookup";

export const ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_FILTER_LABEL = "Filter symptoms";

export const ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_ANCHOR =
  "help-engineering-troubleshooting-symptom-index-heading";

export const ENGINEERING_TROUBLESHOOTING_HELP_ESCALATION_PANEL_TITLE = "Escalate with evidence";

export const ENGINEERING_TROUBLESHOOTING_HELP_ESCALATION_PANEL_BODY =
  "When customer paths and this runbook are exhausted, attach an audit trail excerpt, system-health JSON entry, or request ID in Report a problem.";

export const ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_TITLE = "Repository sources";

export const ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_DISCLOSURE_INTRO =
  "Merged from upstream engineering runbooks in the repository.";

export const ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_STRIP_TITLE = "Related diligence topics";

export const ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_STRIP_INTRO =
  "Use Admin diagnostics and configuration reference when you need live-surface signals or env keys — not sponsor diligence packing.";

export const ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW = {
  title: "Runbook overview",
  audience: "Admin and engineering support — not customer self-serve.",
  stability: "Internal runbook for engineering support.",
  documentTitle: "Engineering troubleshooting runbook",
} as const;

export const ENGINEERING_TROUBLESHOOTING_HELP_ACTION_PANEL_TITLE = "Quick paths";

export const ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS = {
  jumpToSymptomLookup: {
    label: "Jump to symptom lookup",
    href: `#${ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_ANCHOR}`,
  },
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
  readonly evidenceToAttach: string;
  readonly escalationDestinationLabel: string;
  readonly escalationHref?: string;
  readonly runbookSectionId: string;
  readonly severity: FindingSeverityKind;
};

export const ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_ROWS: readonly EngineeringTroubleshootingHelpSymptomRow[] =
  [
    {
      symptom: "API does not start (migration / DbUp)",
      firstCheck: "Fix ConnectionStrings:ArchLucid and confirm SQL is reachable.",
      evidenceToAttach: "DbUp migration output",
      escalationDestinationLabel: "Configuration reference",
      escalationHref: inAppHelpHref("configuration-reference"),
      runbookSectionId: "1-api-exits-at-startup-sql-connection-string-missing-unreachable",
      severity: "critical",
    },
    {
      symptom: "/health/ready returns 503",
      firstCheck: "Read JSON entries[] for the first Unhealthy or Degraded check.",
      evidenceToAttach: "System-health JSON entry",
      escalationDestinationLabel: "System health",
      escalationHref: "/administration/system-health",
      runbookSectionId: "10-healthready-unhealthy-despite-healthlive-ok",
      severity: "high",
    },
    {
      symptom: "401 / 403 on API",
      firstCheck: "Confirm auth mode and JWT roles map to Reader, Operator, or Admin.",
      evidenceToAttach: "Request ID + auth mode",
      escalationDestinationLabel: "Configuration reference",
      escalationHref: inAppHelpHref("configuration-reference"),
      runbookSectionId: "3-401-unauthorized-everywhere",
      severity: "medium",
    },
    {
      symptom: "429 Too Many Requests",
      firstCheck: "Wait for the rate-limit window or adjust RateLimiting settings (non-production).",
      evidenceToAttach: "Rate-limit response headers",
      escalationDestinationLabel: "Configuration reference",
      escalationHref: inAppHelpHref("configuration-reference"),
      runbookSectionId: "8-429-too-many-requests",
      severity: "low",
    },
    {
      symptom: "404 on review or signed review record",
      firstCheck: "Verify review ID and tenant / workspace / project scope headers.",
      evidenceToAttach: "Scope headers + review ID",
      escalationDestinationLabel: "Customer Troubleshooting",
      escalationHref: inAppHelpHref("troubleshooting"),
      runbookSectionId: "quick-matrix",
      severity: "medium",
    },
    {
      symptom: "409 on commit",
      firstCheck: "Follow the conflict message; re-fetch run status before retrying.",
      evidenceToAttach: "Conflict response body",
      escalationDestinationLabel: "Customer Troubleshooting",
      escalationHref: inAppHelpHref("troubleshooting"),
      runbookSectionId: "9-409-conflict-on-manifest-commit",
      severity: "medium",
    },
    {
      symptom: "UI shows 503 invalid upstream API configuration",
      firstCheck: "Set ARCHLUCID_API_BASE_URL in archlucid-ui/.env.local and restart dev.",
      evidenceToAttach: "Proxy configuration excerpt",
      escalationDestinationLabel: "Configuration reference",
      escalationHref: inAppHelpHref("configuration-reference"),
      runbookSectionId: "quick-matrix",
      severity: "high",
    },
    {
      symptom: "UI loads but API calls fail",
      firstCheck: "Inspect browser network tab and Next archlucid-ui-proxy warnings.",
      evidenceToAttach: "Network trace + request ID",
      escalationDestinationLabel: "Admin diagnostics",
      escalationHref: inAppHelpHref("admin-diagnostics"),
      runbookSectionId: "logs-what-to-search-for",
      severity: "high",
    },
    {
      symptom: "run --quick / execute LLM or timeout errors",
      firstCheck: "Prefer simulator mode for pilots; validate AgentExecution / Azure OpenAI config.",
      evidenceToAttach: "Agent execution trace",
      escalationDestinationLabel: "CLI usage",
      escalationHref: inAppHelpHref("cli-usage"),
      runbookSectionId: "5-real-mode-agent-timeouts-breaker-open-missing-azure-openai",
      severity: "high",
    },
    {
      symptom: ".NET tests fail with SQL errors",
      firstCheck: "Set ARCHLUCID_SQL_TEST or run fast core tests only.",
      evidenceToAttach: "Test output excerpt",
      escalationDestinationLabel: "CLI usage",
      escalationHref: inAppHelpHref("cli-usage"),
      runbookSectionId: "quick-matrix",
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

export const ENGINEERING_TROUBLESHOOTING_HELP_CANONICAL_PATH = ENGINEERING_TROUBLESHOOTING_HELP_PATH;
