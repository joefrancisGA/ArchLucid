import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";

const WORKSPACE_RETURN_PREFIXES = ["/settings/workspace", "/architecture", "/help"] as const;

/** Accept same-origin workspace or architecture routes; reject external returnTo values. */
export function resolveFirstLoginWorkspaceHelpReturnHref(returnTo: string | undefined): string | null {
  const trimmed = returnTo?.trim() ?? "";

  if (trimmed.length === 0 || trimmed.startsWith("//") || trimmed.includes("://")) {
    return null;
  }

  if (!WORKSPACE_RETURN_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
    return null;
  }

  return isSafeReturnPath(trimmed) ? trimmed : null;
}

export const FIRST_LOGIN_WORKSPACE_HELP_RETURN_TO_WORKSPACE_LABEL = "Back to workspace" as const;
