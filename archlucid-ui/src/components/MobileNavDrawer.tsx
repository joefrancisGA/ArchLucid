"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type SetStateAction } from "react";

import { SidebarNavCluster } from "@/components/sidebar-nav/SidebarNavCluster";
import { RoleNavDensityExpandControl } from "@/components/sidebar-nav/RoleNavDensityExpandControl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOperatorShellNavRows } from "@/hooks/useOperatorShellNavRows";
import { useArchitectWorkspaceChrome } from "@/hooks/useArchitectWorkspaceChrome";
import { useGovernanceMode } from "@/hooks/use-governance-mode";
import { useSidebarNavGroupExpansion } from "@/hooks/useSidebarNavGroupExpansion";
import { findSidebarNavGroupIdsForActivePath } from "@/lib/sidebar-nav-active-group-expansion";
import { applyBuyerDemoSecondaryNavCollapse } from "@/lib/sidebar-nav-buyer-demo-collapse";
import {
  isSidebarCollapsibleNavGroupId,
  sidebarNavGroupIsExpanded,
  type SidebarCollapsibleNavGroupId,
} from "@/lib/sidebar-nav-group-expansion-storage";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  mobileNavDrawerHrefFromSearch,
  parseMobileNavDrawerOpenFromSearch,
} from "@/lib/operator/mobile-nav-drawer-url";

/**
 * Hamburger + full-height drawer for small screens (sidebar is hidden below `lg`).
 * Uses the same collapsible group model as desktop {@link SidebarNav}.
 */
export function MobileNavDrawer() {
  const pathname = usePathname() ?? "";
  const [open, setOpenState] = useState(() =>
    parseMobileNavDrawerOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("mobileNavOpen"),
    ),
  );
  const openRef = useRef(open);
  openRef.current = open;
  const [mounted, setMounted] = useState(false);

  const syncMobileNavOpenToUrl = useCallback(
    (drawerOpen: boolean) => {
      commitHrefIfChanged(
        mobileNavDrawerHrefFromSearch(readWindowLocationSearch(), drawerOpen, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      const next = typeof value === "function" ? value(openRef.current) : value;

      if (openRef.current === next) {
        return;
      }

      openRef.current = next;
      setOpenState(next);
      syncMobileNavOpenToUrl(next);
    },
    [syncMobileNavOpenToUrl],
  );

  useEffect(() => {
    const syncMobileNavOpenFromUrl = (): void => {
      const nextOpen = parseMobileNavDrawerOpenFromSearch(
        new URLSearchParams(window.location.search).get("mobileNavOpen"),
      );

      if (openRef.current === nextOpen) {
        return;
      }

      openRef.current = nextOpen;
      setOpenState(nextOpen);
    };

    syncMobileNavOpenFromUrl();
    window.addEventListener("popstate", syncMobileNavOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncMobileNavOpenFromUrl);
    };
  }, []);
  const { expansion, toggleGroupExpanded, setGroupExpanded } = useSidebarNavGroupExpansion();
  const { isGovernanceModeEnabled } = useGovernanceMode();
  const {
    allRows,
    buyerPolishedShell,
    demoUi,
    effectiveHasCommittedArchitectureReview,
    effectiveOperateUnlockPhase,
    roleNavDensityHiddenGroupCount,
    roleNavDensityShowFullNav,
    toggleRoleNavDensityShowFullNav,
  } = useOperatorShellNavRows();
  const architectWorkspaceChrome = useArchitectWorkspaceChrome();

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    applyBuyerDemoSecondaryNavCollapse({
      pathname: pathname ?? "/",
      buyerPolishedShell,
      demoUi,
      architectWorkspaceChrome,
      setGroupExpanded,
    });

    const activeGroupIds = findSidebarNavGroupIdsForActivePath(allRows, pathname ?? "/");

    for (const groupId of activeGroupIds) {
      setGroupExpanded(groupId, true);
    }
  }, [allRows, architectWorkspaceChrome, buyerPolishedShell, demoUi, mounted, pathname, setGroupExpanded]);

  function closeDrawer(): void {
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="inline-flex h-8 w-8 items-center justify-center p-0 lg:hidden"
        data-testid="mobile-nav-drawer-trigger"
        aria-label="Open navigation menu"
        onClick={() => {
          setOpen(true);
        }}
      >
        <Menu className="size-5" aria-hidden />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[min(92vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
            <DialogTitle className={cn("text-left font-semibold", OPERATOR_TYPOGRAPHY.body)}>Navigation</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
            {open ? allRows.map((row) => {
              const collapsible = isSidebarCollapsibleNavGroupId(row.group.id);
              const isExpanded = mounted
                ? sidebarNavGroupIsExpanded(row.group.id, expansion)
                : row.group.id === "pilot";

              return (
                <SidebarNavCluster
                  key={row.group.id}
                  row={row}
                  pathname={pathname}
                  demoUi={demoUi}
                  buyerPolishedShell={buyerPolishedShell}
                  isGovernanceModeEnabled={isGovernanceModeEnabled}
                  hasCommittedArchitectureReview={effectiveHasCommittedArchitectureReview}
                  effectiveOperateUnlockPhase={effectiveOperateUnlockPhase}
                  isCollapsible={collapsible}
                  isExpanded={isExpanded}
                  onNavLinkNavigate={closeDrawer}
                  onToggleExpanded={
                    collapsible
                      ? () => {
                          toggleGroupExpanded(row.group.id as SidebarCollapsibleNavGroupId);
                        }
                      : undefined
                  }
                />
              );
            }) : null}
            {open ? (
            <RoleNavDensityExpandControl
              hiddenGroupCount={roleNavDensityHiddenGroupCount}
              showFullNav={roleNavDensityShowFullNav}
              onToggle={toggleRoleNavDensityShowFullNav}
            />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

