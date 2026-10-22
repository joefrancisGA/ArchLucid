import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
import type { SidebarCollapsibleNavGroupId } from "@/lib/sidebar-nav-group-expansion-storage";

export type HelpTopicShellSidebarNavConfig = {
  readonly activeNavHrefs: readonly string[];
  readonly expandedGroupIds: readonly SidebarCollapsibleNavGroupId[];
};

const CONFIGURATION_REFERENCE_HELP_SHELL_SIDEBAR_NAV: HelpTopicShellSidebarNavConfig = {
  activeNavHrefs: [HELP_HUB_CANONICAL_PATH, SETTINGS_ROOT_PATH],
  expandedGroupIds: ["operator-admin"],
};

const HELP_TOPIC_SHELL_SIDEBAR_NAV_BY_PATH: Readonly<Record<string, HelpTopicShellSidebarNavConfig>> = {
  "/help/configuration-reference": CONFIGURATION_REFERENCE_HELP_SHELL_SIDEBAR_NAV,
};

function normalizeHelpTopicShellPathname(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0]?.trim() ?? "";

  if (path.length === 0) {
    return "/";
  }

  return path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
}

/** Virtual sidebar active state for in-app help topics that lack a direct nav href match. */
export function resolveHelpTopicShellSidebarNavConfig(
  pathname: string,
): HelpTopicShellSidebarNavConfig | null {
  const normalized = normalizeHelpTopicShellPathname(pathname);

  return HELP_TOPIC_SHELL_SIDEBAR_NAV_BY_PATH[normalized] ?? null;
}

export function helpTopicShellSidebarNavHrefs(pathname: string): readonly string[] {
  return resolveHelpTopicShellSidebarNavConfig(pathname)?.activeNavHrefs ?? [];
}

export function helpTopicShellSidebarExpandedGroupIds(
  pathname: string,
): readonly SidebarCollapsibleNavGroupId[] {
  return resolveHelpTopicShellSidebarNavConfig(pathname)?.expandedGroupIds ?? [];
}
