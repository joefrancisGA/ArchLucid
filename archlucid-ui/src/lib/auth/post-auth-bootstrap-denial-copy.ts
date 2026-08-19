/** Buyer-safe denial copy for post-auth bootstrap no-access (TB-1468). */

const DEFAULT_NO_ACCESS_MESSAGE =
  "Sign-in succeeded, but no workspace is available for this account.";

/** Keep aligned with `PostAuthBootstrapService` customer-facing denial strings. */
const KNOWN_DENIAL_MESSAGES = new Set<string>([
  "An organization with this name or email domain may already use ArchLucid. Request access instead of creating a duplicate workspace.",
  "You already have an active evaluation workspace. Sign in to continue or contact support for another organization.",
]);

const TECHNICAL_DENIAL_PATTERN =
  /\b(system\.|stack\s*trace|sql|internal server|\w+exception|unauthorized|forbidden)\b| at [\w.]+\(|:\d{2,}:\d{2,}|status code \d{3}/i;

export function resolvePostAuthBootstrapDenialMessage(denialReason?: string | null): string {
  if (!denialReason?.trim()) {
    return DEFAULT_NO_ACCESS_MESSAGE;
  }

  const trimmed = denialReason.trim();

  if (KNOWN_DENIAL_MESSAGES.has(trimmed)) {
    return trimmed;
  }

  if (TECHNICAL_DENIAL_PATTERN.test(trimmed) || trimmed.length > 280) {
    return DEFAULT_NO_ACCESS_MESSAGE;
  }

  return trimmed;
}

export const POST_AUTH_BOOTSTRAP_COPY = {
  selectWorkspaceLead: "Choose the workspace you want to open.",
  selectWorkspaceEmpty:
    "No workspaces are available for this account. Request access or sign in with a different email.",
  selectWorkspaceContinueLabel: (workspaceName: string) => `Continue to ${workspaceName}`,
  selectWorkspaceOpenLabel: (workspaceName: string) => `Open ${workspaceName}`,
} as const;
