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

export const ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_STRIP_TITLE = "Related diligence topics";

export const ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_STRIP_INTRO =
  "Use Admin diagnostics and configuration reference when you need live-surface signals or env keys — not sponsor diligence packing.";

export const ENGINEERING_TROUBLESHOOTING_HELP_ORIENTATION_TITLE = "When to use this runbook";

export const ENGINEERING_TROUBLESHOOTING_HELP_ORIENTATION =
  "Open customer Troubleshooting and System health first. Use this Admin eng runbook only when you need CLI, migration, proxy, or auth-depth triage after those paths.";

export const ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW = {
  title: "Runbook overview",
  audience: "Admin and engineering support — not customer self-serve.",
  stability: "Internal runbook; registry-verified 2026-08-09.",
  documentSource: "docs/runbooks/TROUBLESHOOTING.md + docs/runbooks/COMMON_ERRORS.md",
} as const;

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
  readonly escalationHref?: string;
  readonly severity: FindingSeverityKind;
};

export const ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_ROWS: readonly EngineeringTroubleshootingHelpSymptomRow[] =
  [
    {
      symptom: "API does not start (migration / DbUp)",
      firstCheck: "Fix ConnectionStrings:ArchLucid and confirm SQL is reachable.",
      escalationArtifact: "Configuration reference",
      escalationHref: inAppHelpHref("configuration-reference"),
      severity: "critical",
    },
    {
      symptom: "/health/ready returns 503",
      firstCheck: "Read JSON entries[] for the first Unhealthy or Degraded check.",
      escalationArtifact: "System health",
      escalationHref: "/administration/system-health",
      severity: "high",
    },
    {
      symptom: "401 / 403 on API",
      firstCheck: "Confirm auth mode and JWT roles map to Reader, Operator, or Admin.",
      escalationArtifact: "Configuration reference",
      escalationHref: inAppHelpHref("configuration-reference"),
      severity: "medium",
    },
    {
      symptom: "429 Too Many Requests",
      firstCheck: "Wait for the rate-limit window or adjust RateLimiting settings (non-production).",
      escalationArtifact: "Configuration reference",
      escalationHref: inAppHelpHref("configuration-reference"),
      severity: "low",
    },
    {
      symptom: "404 on review or signed review record",
      firstCheck: "Verify review ID and tenant / workspace / project scope headers.",
      escalationArtifact: "Customer Troubleshooting",
      escalationHref: inAppHelpHref("troubleshooting"),
      severity: "medium",
    },
    {
      symptom: "409 on commit",
      firstCheck: "Follow the conflict message; re-fetch run status before retrying.",
      escalationArtifact: "Customer Troubleshooting",
      escalationHref: inAppHelpHref("troubleshooting"),
      severity: "medium",
    },
    {
      symptom: "UI shows 503 invalid upstream API configuration",
      firstCheck: "Set ARCHLUCID_API_BASE_URL in archlucid-ui/.env.local and restart dev.",
      escalationArtifact: "Configuration reference",
      escalationHref: inAppHelpHref("configuration-reference"),
      severity: "high",
    },
    {
      symptom: "UI loads but API calls fail",
      firstCheck: "Inspect browser network tab and Next archlucid-ui-proxy warnings.",
      escalationArtifact: "Admin diagnostics",
      escalationHref: inAppHelpHref("admin-diagnostics"),
      severity: "high",
    },
    {
      symptom: "run --quick / execute LLM or timeout errors",
      firstCheck: "Prefer simulator mode for pilots; validate AgentExecution / Azure OpenAI config.",
      escalationArtifact: "CLI usage",
      escalationHref: inAppHelpHref("cli-usage"),
      severity: "high",
    },
    {
      symptom: ".NET tests fail with SQL errors",
      firstCheck: "Set ARCHLUCID_SQL_TEST or run fast core tests only.",
      escalationArtifact: "CLI usage",
      escalationHref: inAppHelpHref("cli-usage"),
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
