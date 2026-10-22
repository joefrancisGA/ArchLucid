"use client";

import { cn } from "@/lib/utils";

import type { ReactElement } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SHOW_ALL_DESTINATIONS } from "@/lib/nav-disclosure-copy";

type RoleNavDensityExpandControlProps = {
  readonly hiddenGroupCount: number;
  readonly showFullNav: boolean;
  readonly onToggle: () => void;
};

/** Sidebar escape hatch when role-shaped density hides non-primary nav groups (TB-2139). */
export function RoleNavDensityExpandControl(props: RoleNavDensityExpandControlProps): ReactElement | null {
  if (props.hiddenGroupCount === 0 && props.showFullNav) {
    return null;
  }

  const label = props.showFullNav ? SHOW_ALL_DESTINATIONS.hide : SHOW_ALL_DESTINATIONS.show;

  return (
    <div className="border-t border-neutral-200 px-2 py-2 dark:border-neutral-700">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "sidebar-disclosure-trigger w-full justify-start gap-2 px-3 py-2 text-left text-neutral-900 shadow-none hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800",
        )}
        data-testid="role-nav-density-expand-toggle"
        aria-pressed={props.showFullNav}
        title={SHOW_ALL_DESTINATIONS.title}
        onClick={props.onToggle}
      >
        {props.showFullNav ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        )}
        <span className="min-w-0 flex-1">
          {label}
          {!props.showFullNav && props.hiddenGroupCount > 0
            ? ` (${props.hiddenGroupCount} more)`
            : null}
        </span>
      </Button>
    </div>
  );
}
