"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";

import { GovernanceModeToggle } from "@/components/GovernanceModeToggle";
import { SidebarNavCluster } from "@/components/sidebar-nav/SidebarNavCluster";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOperatorShellNavRows } from "@/hooks/useOperatorShellNavRows";
import { useSidebarNavGroupExpansion } from "@/hooks/useSidebarNavGroupExpansion";
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
  const { allRows, buyerPolishedShell, demoUi, effectiveHasCommittedArchitectureReview, effectiveOperateUnlockPhase } =
    useOperatorShellNavRows();

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  function closeDrawer(): void {
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
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
            <DialogTitle className="text-left text-base font-semibold">Navigation</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
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
            })}
            <div className="mt-2 border-t border-neutral-200 px-2 pt-2 dark:border-neutral-700">
              <GovernanceModeToggle />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
