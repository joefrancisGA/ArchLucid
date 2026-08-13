"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { ChevronRight } from "lucide-react";
import type { ReactElement } from "react";

import { NAV_DISCLOSURE } from "@/lib/nav-disclosure-copy";

type SidebarGovernanceDisclosureSectionProps = {
  readonly onRevealGovernance: () => void;
};

/** Collapsed governance row — unlocks operate-governance destinations without the misleading global advanced toggle. */
export function SidebarGovernanceDisclosureSection(
  props: SidebarGovernanceDisclosureSectionProps,
): ReactElement {
  return (
    <div
      className="mt-2 border-t border-neutral-200 px-2 pt-2 dark:border-neutral-700"
      data-testid="sidebar-governance-disclosure"
    >
      <button
        type="button"
        className={cn("sidebar-disclosure-trigger flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left font-semibold uppercase tracking-wide text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800/80", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="sidebar-governance-disclosure-toggle"
        aria-label={`${NAV_DISCLOSURE.advancedOperationsSidebar.show}. ${NAV_DISCLOSURE.advancedOperationsSidebar.assistiveCollapsed}`}
        onClick={() => {
          props.onRevealGovernance();
        }}
      >
        <span className="flex min-w-0 items-center gap-2">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          <span>Governance</span>
        </span>
        <span className={cn("shrink-0 normal-case tracking-normal font-medium text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          {NAV_DISCLOSURE.advancedOperationsSidebar.show}
        </span>
      </button>
    </div>
  );
}
