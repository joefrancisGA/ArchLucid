import { sanitizeOperatorFacingText } from "@/lib/api-validation-problem";
import {
  containsForbiddenOAuthCallbackLeak,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_GENERIC_FAILURE,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-error-copy";
import { ITSM_ATLASSIAN_OAUTH_CALLBACK_CONTACT_SUPPORT_LABEL } from "@/lib/itsm/itsm-atlassian-oauth-callback-page-copy";
import { ARCHLUCID_SUPPORT_EMAIL } from "@/lib/support-workspace-present";

export type ItsmAtlassianOAuthCallbackFailureKind =
  | "idp-denial"
  | "incomplete-response"
  | "refresh-token-store-failed"
  | "api-failure";

/** ISO-style UTC label for support disclosure — e.g. `Aug 12, 2026, 2:34 PM UTC`. */
export function formatItsmAtlassianOAuthCallbackUtcTimestamp(date: Date): string {
  return `${date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })} UTC`;
}

function toOperatorSafeSupportField(
  raw: string | null | undefined,
  fallback: string,
): string {
  if (raw === null || raw === undefined || raw.trim().length === 0) {
    return fallback;
  }

  const sanitized = sanitizeOperatorFacingText(raw.trim());

  if (sanitized.length === 0 || containsForbiddenOAuthCallbackLeak(sanitized)) {
    return fallback;
  }

  return sanitized;
}

export function resolveItsmAtlassianOAuthCallbackWorkspaceLabel(
  workspaceLabel: string | null | undefined,
): string | null {
  if (workspaceLabel === null || workspaceLabel === undefined || workspaceLabel.trim().length === 0) {
    return null;
  }

  const sanitized = toOperatorSafeSupportField(workspaceLabel, "");

  return sanitized.length > 0 ? sanitized : null;
}

export function buildItsmAtlassianOAuthCallbackSupportMailtoHref(params: {
  readonly correlationId: string;
  readonly timestampUtc: string;
  readonly workspaceLabel: string | null;
  readonly failureMessage: string;
}): string {
  const safeMessage = toOperatorSafeSupportField(
    params.failureMessage,
    ITSM_ATLASSIAN_OAUTH_CALLBACK_GENERIC_FAILURE,
  );
  const subject = encodeURIComponent("ArchLucid Jira OAuth consent support");
  const bodyLines = [
    "Issue: Atlassian OAuth consent callback failed",
    `Reference ID: ${params.correlationId}`,
    `Timestamp (UTC): ${params.timestampUtc}`,
  ];

  if (params.workspaceLabel !== null) {
    bodyLines.push(`Workspace: ${params.workspaceLabel}`);
  }

  bodyLines.push("", safeMessage);

  const body = encodeURIComponent(bodyLines.join("\n"));

  return `mailto:${ARCHLUCID_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

export function itsmAtlassianOAuthCallbackSupportLinkLabel(): string {
  return ITSM_ATLASSIAN_OAUTH_CALLBACK_CONTACT_SUPPORT_LABEL;
}
