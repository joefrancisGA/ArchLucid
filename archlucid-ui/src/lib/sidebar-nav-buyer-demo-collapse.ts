import type { SidebarCollapsibleNavGroupId } from "@/lib/sidebar-nav-group-expansion-storage";

/**
 * Collapses Integrations + Administration (+ Internal Ops) unless the route is inside them.
 * Shared by desktop sidebar and mobile drawer so first-open mobile matches desktop defaults.
 */
export function applyBuyerDemoSecondaryNavCollapse(input: {
  readonly pathname: string;
  readonly buyerPolishedShell: boolean;
  readonly demoUi: boolean;
  readonly setGroupExpanded: (groupId: SidebarCollapsibleNavGroupId, expanded: boolean) => void;
}): void {
  if (!input.buyerPolishedShell && !input.demoUi) {
    return;
  }

  const route = input.pathname;
  const onIntegrationsRoute = route.startsWith("/integrations");
  const onAdminRoute =
    route.startsWith("/administration")
    || route.startsWith("/admin");

  if (!onIntegrationsRoute) {
    input.setGroupExpanded("operate-integrations", false);
  }

  if (!onAdminRoute) {
    input.setGroupExpanded("operator-admin", false);
    input.setGroupExpanded("operator-system-admin", false);
  }
}
