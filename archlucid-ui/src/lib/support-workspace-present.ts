export const ARCHLUCID_SUPPORT_EMAIL = "support@archlucid.net";

export const SUPPORT_PAGE_GUIDANCE =
  "Need help with a review, evidence source, integration, or system health issue? Start by checking system health, then download a redacted support bundle if requested by ArchLucid support.";

export const SUPPORT_BUNDLE_SAFETY_SUMMARY =
  "The bundle is redacted before download. Review it before sharing outside your organization.";

export const SUPPORT_CONTACT_WORKFLOW =
  "Email ArchLucid support with the details below. Attach a support bundle only when support requests diagnostics.";

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
    route: "/admin/health",
  },
  {
    id: "troubleshooting-guide",
    title: "Open troubleshooting guide",
    detail: "Follow step-by-step fixes for loading, review, evidence, and export issues.",
    route: "help:troubleshooting",
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
