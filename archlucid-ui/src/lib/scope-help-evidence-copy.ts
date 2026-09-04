import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const SCOPE_HELP_CANONICAL_PATH = "/help/scope" as const;

export const SCOPE_HELP_TOPIC_LABEL = "How workspace and scope work" as const;

export const SCOPE_HELP_PRIMARY_ACTION = {
  label: "Open tenant settings",
  href: "/administration/workspace-settings",
  testId: "help-scope-open-tenant-settings",
} as const;

export const SCOPE_HELP_CLAIM_DISCIPLINE =
  "This guide explains tenant, workspace, and project boundaries for architects — help only, not a full audit export. Open Users and roles or Data handling when you need access or isolation depth.";

export const SCOPE_HELP_PAGE_TITLE = "Workspace and scope guide" as const;

export const SCOPE_HELP_PAGE_SUBTITLE =
  "Understand tenant, workspace, and project scope, including how the header switcher and sample workspace work.";

export const SCOPE_HELP_FOLLOW_UPS_TITLE = "Where to go next" as const;

export const SCOPE_HELP_SOURCES_INTRO =
  "Open these guides when scope boundaries affect access, isolation, or first-review setup.";

export type ScopeHelpSourceLink = {
  readonly label: string;
  readonly href: string;
  readonly when: string;
};

/** Operator Sources — no self-href to `/help/scope`. */
export const SCOPE_HELP_SOURCES: readonly ScopeHelpSourceLink[] = [
  {
    label: "Getting started",
    href: inAppHelpHref("getting-started"),
    when: "First-review workflow and where scope shows up in the product",
  },
  {
    label: "Users and roles",
    href: inAppHelpHref("users-and-roles"),
    when: "Role and permission boundaries across tenant and workspace",
  },
  {
    label: "Data handling & isolation",
    href: inAppHelpHref("data-handling"),
    when: "Tenant isolation and data-handling assurances for procurement reviewers",
  },
] as const;

export const SCOPE_HELP_CURRENT_SCOPE_PANEL_TITLE = "Your current scope";

export const SCOPE_HELP_CURRENT_SCOPE_SWITCHING_AVAILABLE =
  "Workspace and project switching is available from the top-bar scope switcher.";

export const SCOPE_HELP_CURRENT_SCOPE_SWITCHING_UNAVAILABLE =
  "Workspace switching is disabled for this session.";
