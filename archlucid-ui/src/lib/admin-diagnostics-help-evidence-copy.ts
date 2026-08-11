import type { EvidenceAdminSourceLink } from "@/lib/evidence-surface-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH = "/help/admin-diagnostics" as const;

export const ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE = "Admin diagnostics" as const;

export const ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE =
  "Orientation for system health, workspace readiness, assistant diagnostics, and observability signals." as const;

export const ADMIN_DIAGNOSTICS_HELP_PAGE_SCOPE =
  "Use this page when a workspace symptom points to platform health rather than a single architecture review." as const;

export const ADMIN_DIAGNOSTICS_HELP_LIVE_PANEL_TITLE = "Live workspace surfaces" as const;

export const ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS_TITLE = "Related Help topics" as const;

export const ADMIN_DIAGNOSTICS_HELP_LIVE_PANEL_INTRO =
  "Open these workspace routes for current probe results and readiness — not the illustrative signal table below." as const;

export const ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS_INTRO =
  "Symptom-first guidance and support intake when diagnostics vocabulary turns into triage." as const;

export const ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION_TITLE = "What this page is" as const;

export const ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION =
  "This guide explains where to check platform health and workspace readiness in ArchLucid. It is orientation help — not a live health report or an audit export from your tenant. When you need current probe results or support triage, open System health, Troubleshooting, or Engineering troubleshooting runbook.";

export const ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION = {
  label: "System health",
  href: "/administration/system-health",
  adminOnly: true,
} as const;

export type AdminDiagnosticsHelpSourceLink = EvidenceAdminSourceLink;

/** Non-`/help/*` workspace routes — System health is promoted to the header primary CTA. */
export const ADMIN_DIAGNOSTICS_HELP_LIVE_SURFACES: readonly EvidenceAdminSourceLink[] = [
  { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
] as const;

/** In-app help topics — rendered once in the related-topics block (not duplicated in markdown). */
export const ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS: readonly EvidenceAdminSourceLink[] = [
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Report a problem", href: inAppHelpHref("report-a-problem") },
  {
    label: "Engineering troubleshooting runbook",
    href: inAppHelpHref("engineering-troubleshooting"),
    adminOnly: true,
  },
  { label: "Configuration reference", href: inAppHelpHref("configuration-reference"), adminOnly: true },
  { label: "CLI usage", href: inAppHelpHref("cli-usage"), adminOnly: true },
] as const;

export type AdminDiagnosticsHelpSignalRow = {
  readonly signal: string;
  readonly healthyDescription: string;
  readonly nextStep: string;
};

export const ADMIN_DIAGNOSTICS_HELP_SIGNAL_SECTION_TITLE = "What each signal means" as const;

export const ADMIN_DIAGNOSTICS_HELP_SIGNAL_HEALTHY_COLUMN = "What healthy looks like" as const;

export const ADMIN_DIAGNOSTICS_HELP_SIGNAL_ROWS: readonly AdminDiagnosticsHelpSignalRow[] = [
  {
    signal: "API readiness",
    healthyDescription: "Ready",
    nextStep: "Open System health; capture correlation id from any failed call",
  },
  {
    signal: "SQL / storage",
    healthyDescription: "Configured",
    nextStep: "Check readiness row for database or blob configuration",
  },
  {
    signal: "Search index",
    healthyDescription: "Ready when enabled",
    nextStep: "Degraded search may block global search — note scope",
  },
  {
    signal: "Assistant / LLM",
    healthyDescription: "Within budget",
    nextStep: `Trial or budget banners on ${OPERATOR_NAV_LINK_LABELS.home} explain limits`,
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
