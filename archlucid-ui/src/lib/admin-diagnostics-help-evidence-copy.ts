import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH = "/help/admin-diagnostics" as const;

export const ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE = "Admin diagnostics" as const;

export const ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE =
  "System health, workspace readiness, assistant diagnostics, and observability signals for platform health." as const;

export const ADMIN_DIAGNOSTICS_HELP_ACTION_PANEL_TITLE = "Go to live diagnostics" as const;

export const ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTIONS = {
  openSystemHealth: { label: "Open System health", href: "/administration/system-health" },
  openWorkspaceOverview: { label: "Workspace Overview", href: "/" },
} as const;

export const ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION_TITLE = "What this page is" as const;

export const ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION =
  "This guide explains where to check platform health and workspace readiness in ArchLucid. It is orientation help — not a live health report or an audit export from your tenant. When you need current probe results or support triage, open System health, Troubleshooting, or Engineering troubleshooting runbook.";

export const ADMIN_DIAGNOSTICS_HELP_SOURCES_INTRO =
  "Use these follow-ups when diagnostics vocabulary turns into live health probes, eng runbooks, or customer triage.";

export type AdminDiagnosticsHelpSourceLink = {
  readonly label: string;
  readonly href: string;
  readonly adminOnly?: boolean;
};

/** Operator Sources — no self-href to `/help/admin-diagnostics`. */
export const ADMIN_DIAGNOSTICS_HELP_SOURCES: readonly AdminDiagnosticsHelpSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  {
    label: "Engineering troubleshooting runbook",
    href: inAppHelpHref("developer-troubleshooting"),
    adminOnly: true,
  },
  { label: "Configuration reference", href: inAppHelpHref("configuration-reference"), adminOnly: true },
  { label: "CLI usage", href: inAppHelpHref("cli-usage"), adminOnly: true },
] as const;

export type AdminDiagnosticsHelpSignalRow = {
  readonly signal: string;
  readonly healthyKind: EnterpriseStatusKind;
  readonly healthyLabel: string;
  readonly nextStep: string;
};

export const ADMIN_DIAGNOSTICS_HELP_SIGNAL_SECTION_TITLE = "What each signal means" as const;

export const ADMIN_DIAGNOSTICS_HELP_SIGNAL_ROWS: readonly AdminDiagnosticsHelpSignalRow[] = [
  {
    signal: "API readiness",
    healthyKind: "ready",
    healthyLabel: "Ready",
    nextStep: "Open System health; capture correlation id from any failed call",
  },
  {
    signal: "SQL / storage",
    healthyKind: "ready",
    healthyLabel: "Configured",
    nextStep: "Check readiness row for database or blob configuration",
  },
  {
    signal: "Search index",
    healthyKind: "ready",
    healthyLabel: "Ready when enabled",
    nextStep: "Degraded search may block global search — note scope",
  },
  {
    signal: "Assistant / LLM",
    healthyKind: "ready",
    healthyLabel: "Within budget",
    nextStep: "Trial or budget banners on Overview explain limits",
  },
] as const;

const ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS_MARKER = "## Related Help topics";

/** Splits prepared markdown so signal + orientation chrome can sit between procedure and related topics. */
export function splitAdminDiagnosticsHelpMarkdown(markdown: string): {
  readonly procedureMarkdown: string;
  readonly relatedMarkdown: string;
} {
  const index = markdown.indexOf(ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS_MARKER);

  if (index < 0) {
    return { procedureMarkdown: markdown, relatedMarkdown: "" };
  }

  return {
    procedureMarkdown: markdown.slice(0, index).trimEnd(),
    relatedMarkdown: markdown.slice(index).trimStart(),
  };
}
