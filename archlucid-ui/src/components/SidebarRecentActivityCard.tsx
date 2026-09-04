"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { BeforeAfterDeltaPanel } from "@/components/BeforeAfterDeltaPanel";
import { hasMeaningfulSidebarDeltaMedians } from "@/components/BeforeAfterDelta/formatDelta";
import { useDeltaQuery } from "@/components/BeforeAfterDelta/useDeltaQuery";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const RECENT_ACTIVITY_OPEN_KEY = "archlucid_sidebar_recent_activity_open";

/**
 * Collapsible "Recent activity" card at the top of the sidebar. Wraps the new
 * `BeforeAfterDeltaPanel` `sidebar` variant so the median delta on findings + time
 * is one glance away from any operator route. Open state persists in localStorage —
 * collapsed by default the very first time so the card does not push nav links down
 * for a brand-new operator with zero context.
 *
 * Hidden entirely until at least one finalized run exists (same rule as the compact
 * sidebar delta panel) so first-run tenants do not see an empty collapsible.
 */
export function SidebarRecentActivityCard() {
  const { isWorkingMode } = useWorkspaceMode();
  const { status, data } = useDeltaQuery({ count: 5 });
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") {
        return;
      }

      const raw = window.localStorage.getItem(RECENT_ACTIVITY_OPEN_KEY);

      setOpen(raw === "1");
    } catch {
      setOpen(false);
    }
  }, []);

  if (isWorkingMode) {
    return null;
  }

  function persist(next: boolean): void {
    setOpen(next);

    try {
      window.localStorage.setItem(RECENT_ACTIVITY_OPEN_KEY, next ? "1" : "0");
    } catch {
      /* private mode */
    }
  }

  const hasDeltaData =
    status === "ready" &&
    data !== null &&
    data.returnedCount > 0 &&
    hasMeaningfulSidebarDeltaMedians(data);

  if (!hasDeltaData) {
    return null;
  }

  return (
    <Collapsible open={open} onOpenChange={persist}>
      <CollapsibleTrigger
        className={cn("sidebar-disclosure-trigger flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left font-semibold uppercase tracking-wide text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}
        type="button"
        aria-expanded={open}
        aria-controls="sidebar-recent-activity-content"
      >
        <span>Recent activity</span>
        <ChevronDown
          className={cn("mt-0.5 h-4 w-4 shrink-0 transition-transform", open ? "rotate-0" : "-rotate-90")}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent id="sidebar-recent-activity-content">
        <div data-testid="sidebar-recent-activity-card" className="px-2 py-2">
          <BeforeAfterDeltaPanel variant="sidebar" />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
