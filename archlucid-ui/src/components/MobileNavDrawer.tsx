"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarNavCluster } from "@/components/sidebar-nav/SidebarNavCluster";
import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useSidebarNavGroupExpansion } from "@/hooks/useSidebarNavGroupExpansion";
import { NAV_GROUPS } from "@/lib/nav-config";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import {
  isSidebarCollapsibleNavGroupId,
  sidebarNavGroupIsExpanded,
  type SidebarCollapsibleNavGroupId,
} from "@/lib/sidebar-nav-group-expansion-storage";

/**
 * Hamburger + full-height drawer for small screens (sidebar is hidden below `lg`).
 * Uses the same collapsible group model as desktop {@link SidebarNav}.
 */
export function MobileNavDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { expansion, toggleGroupExpanded } = useSidebarNavGroupExpansion();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const demoUi = isStaticDemoPayloadFallbackEnabled();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  const navExpanded = true;
  const navAdvanced = true;
  const effectiveOperateUnlockPhase = 2 as const;
  const omitAdminClusters = demoUi && !buyerPolishedShell;

  const reviewNavRows = listNavGroupsVisibleInOperatorShell(
    NAV_GROUPS,
    navExpanded,
    navAdvanced,
    callerAuthorityRank,
    false,
    "review-workflow",
    hasCommittedArchitectureReview,
    effectiveOperateUnlockPhase,
  );

  const adminNavRows: NavGroupWithVisibleLinks[] =
    omitAdminClusters
      ? []
      : listNavGroupsVisibleInOperatorShell(
          NAV_GROUPS,
          navExpanded,
          navAdvanced,
          callerAuthorityRank,
          false,
          "platform-admin",
          hasCommittedArchitectureReview,
          effectiveOperateUnlockPhase,
        );

  const allRows = [...reviewNavRows, ...adminNavRows];

  function closeDrawer(): void {
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0 lg:hidden"
        aria-label="Open navigation menu"
        onClick={() => {
          setOpen(true);
        }}
      >
        <Menu className="h-5 w-5" aria-hidden />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="!left-0 !top-0 flex h-full max-h-screen w-[min(100vw,20rem)] max-w-[min(100vw,20rem)] !translate-x-0 !translate-y-0 flex-col gap-0 overflow-y-auto rounded-none border-0 border-r border-neutral-200 p-0 shadow-xl data-[state=closed]:!slide-out-to-left-0 data-[state=open]:!slide-in-from-left-0 dark:border-neutral-700 sm:max-w-[20rem]">
          <DialogHeader className="border-b border-neutral-200 px-4 py-3 text-left dark:border-neutral-700">
            <DialogTitle className="text-base">Operator navigation</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-0 px-1 py-2">
            {allRows.map((row) => {
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
                  hasCommittedArchitectureReview={hasCommittedArchitectureReview}
                  effectiveOperateUnlockPhase={effectiveOperateUnlockPhase}
                  isCollapsible={collapsible}
                  isExpanded={isExpanded}
                  onToggleExpanded={
                    collapsible
                      ? () => {
                          toggleGroupExpanded(row.group.id as SidebarCollapsibleNavGroupId);
                        }
                      : undefined
                  }
                  onNavLinkNavigate={closeDrawer}
                />
              );
            })}
            {buyerPolishedShell ? null : (
              <p className="px-2 pt-2 text-xs text-neutral-700 dark:text-neutral-300" aria-keyshortcuts="Shift+?">
                Press Shift+/ for documentation search; open Guides from the panel for shortcuts
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
