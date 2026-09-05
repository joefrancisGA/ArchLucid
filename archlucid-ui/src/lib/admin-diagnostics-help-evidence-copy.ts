import { ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE } from "@/lib/admin-diagnostics-help-page-copy";
import {
  ADMIN_DIAGNOSTICS_HELP_ADMIN_RELATED_TOPICS,
  ADMIN_DIAGNOSTICS_HELP_BUYER_RELATED_TOPICS,
} from "@/lib/admin-diagnostics-help-related-topics";
import type { EvidenceAdminSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export { ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE };

export const ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH = "/help/admin-diagnostics" as const;

export const ADMIN_DIAGNOSTICS_HELP_TOPIC_LABEL = "How admin diagnostics work" as const;

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
  "This guide explains where to check platform health and workspace readiness in ArchLucid. It is orientation help — not a live health report or an audit export from your tenant. When you need current probe results or support triage, open Troubleshooting or Report a problem.";

export const ADMIN_DIAGNOSTICS_HELP_CLAIM_DISCIPLINE =
  "This guide explains where to check platform health and workspace readiness — orientation help only, not a live health report or audit export from your tenant.";

export const ADMIN_DIAGNOSTICS_HELP_FOLLOW_UPS_TITLE = "Where to go next" as const;

export const ADMIN_DIAGNOSTICS_HELP_SOURCES_INTRO =
  "Use these follow-ups when diagnostics vocabulary turns into live probes, system health checks, or support triage.";

export const ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION = {
  label: "System health",
  href: "/administration/system-health",
  adminOnly: true,
  testId: "help-admin-diagnostics-primary-action",
} as const;

/** Operator Sources — no self-href to `/help/admin-diagnostics`. */
export const ADMIN_DIAGNOSTICS_HELP_SOURCES: readonly EvidenceAdminSourceLink[] = [
  { label: ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.label, href: ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.href },
  ...ADMIN_DIAGNOSTICS_HELP_BUYER_RELATED_TOPICS,
  { label: "Integration readiness help", href: inAppHelpHref("integration-readiness") },
] as const;

export type AdminDiagnosticsHelpSourceLink = EvidenceAdminSourceLink;

/** Non-`/help/*` workspace routes — System health is promoted to the header primary CTA. */
export const ADMIN_DIAGNOSTICS_HELP_LIVE_SURFACES: readonly EvidenceAdminSourceLink[] = [
  { label: OPERATOR_NAV_LINK_LABELS.home, href: "/" },
] as const;

/** In-app help topics — buyer Related block; eng runbooks append for Admin callers only (TB-1612). */
export const ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS: readonly EvidenceAdminSourceLink[] = [
  ...ADMIN_DIAGNOSTICS_HELP_BUYER_RELATED_TOPICS,
  ...ADMIN_DIAGNOSTICS_HELP_ADMIN_RELATED_TOPICS,
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
