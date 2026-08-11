export const ARCHLUCID_SUPPORT_EMAIL = "support@archlucid.net";

export const SUPPORT_PAGE_GUIDANCE =
  "When a page shows Report problem, use it first — it sends structured diagnostics and a report reference. For general questions or when you are not on an error surface, use Administration → Support (administrators only) or email below.";

export const SUPPORT_BUNDLE_SAFETY_SUMMARY =
  "The bundle is redacted before download. Review it before sharing outside your organization.";

export const SUPPORT_CONTACT_WORKFLOW =
  "Prefer Report problem on in-product error surfaces (review failures, API problem cards, connectivity errors). Email ArchLucid support when you need a manual thread or are not on a failure page.";

export const SUPPORT_REPORT_PROBLEM_HELP_HREF = "/help/report-a-problem";

export const SUPPORT_REPORT_PROBLEM_SUMMARY =
  "Report problem captures review and workspace context, product version, correlation id, route, and your note — only after you confirm consent. You receive a report reference and a next-business-day response commitment.";

export const SUPPORT_EMAIL_FALLBACK_SUMMARY =
  "Email is a secondary path when Report problem is not available on the current page.";

export const SUPPORT_BUNDLE_INCLUDED_ITEMS = [
  "Workspace diagnostics",
  "Recent health check results",
  "Integration configuration status",
  "Non-secret environment metadata",
  "Relevant error summaries",
] as const;

export const SUPPORT_BUNDLE_EXCLUDED_ITEMS = [
  "Secrets and API keys",
  "Full evidence document contents",
  "User passwords or tokens",
  "Raw buyer or customer confidential content where possible",
] as const;

export const SUPPORT_REQUEST_CHECKLIST = [
  "Report reference id (from Report problem) or correlation / request id",
  "Workspace name",
  "Affected review or page",
  "What you expected",
  "What happened",
  "Approximate time of issue",
  "Support bundle if requested",
] as const;

export type SupportTroubleshootingShortcut = {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly route: string;
  readonly internalOnly?: boolean;
};

export const SUPPORT_TROUBLESHOOTING_SHORTCUTS: readonly SupportTroubleshootingShortcut[] = [
  {
    id: "system-health",
    title: "Check system health",
    detail: "Start here for API readiness, dependency status, and recent health signals.",
    route: "/internal/health",
  },
  {
    id: "troubleshooting-guide",
    title: "Open troubleshooting guide",
    detail: "Follow step-by-step fixes for loading, review, evidence, and export issues.",
    route: "help:troubleshooting",
  },
  {
    id: "report-a-problem",
    title: "How Report problem works",
    detail: "What we capture, consent, optional bundle attach, and the next-business-day response commitment.",
    route: "help:report-a-problem",
  },
  {
    id: "admin-diagnostics",
    title: "View admin diagnostics",
    detail: "Internal operator reference for workspace readiness and platform health signals.",
    route: "help:admin-diagnostics",
    internalOnly: true,
  },
] as const;

export function resolveSupportTroubleshootingHref(route: string): string {
  if (route.startsWith("help:")) {
    return `/help/${route.slice("help:".length)}`;
  }

  return route;
}

export type SupportBundleStatus =
  | "idle"
  | "generating"
  | "ready"
  | "failed"
  | "permission_required";

export function resolveSupportBundleStatusLabel(
  status: SupportBundleStatus,
  lastGeneratedAt: Date | null,
): string {
  switch (status) {
    case "generating":
      return "Generating redacted support bundle…";
    case "ready":
      return lastGeneratedAt === null
        ? "Download ready."
        : `Download ready — last generated ${lastGeneratedAt.toLocaleString()}.`;
    case "failed":
      return "Download failed. Try again or contact support with the error below.";
    case "permission_required":
      return "Execute authority or higher is required to generate a support bundle.";
    default:
      return "No support bundle generated yet in this session.";
  }
}

export function buildSupportRequestTemplate(workspaceLabel: string | null): string {
  const workspaceLine =
    workspaceLabel !== null && workspaceLabel.trim().length > 0
      ? workspaceLabel.trim()
      : "[Workspace name]";

  return [
    "Subject: ArchLucid support request",
    "",
    `Workspace: ${workspaceLine}`,
    "Affected review or page:",
    "What I expected:",
    "What happened:",
    "Approximate time of issue:",
    "Support bundle attached: No",
    "",
    "Additional details:",
  ].join("\n");
}

export function classifySupportBundleDownloadError(status: number, bodyText: string): SupportBundleStatus {
  if (status === 401 || status === 403) {
    return "permission_required";
  }

  void bodyText;

  return "failed";
}

export function formatSupportBundleDownloadError(status: SupportBundleStatus, cause: unknown): string {
  if (status === "permission_required") {
    return "You do not have permission to generate a support bundle. Ask a tenant administrator or operator with Execute authority.";
  }

  if (cause instanceof Error) {
    return cause.message;
  }

  return String(cause);
}
