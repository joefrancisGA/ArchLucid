"use client";

import { usePathname } from "next/navigation";

import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { pathnameShowsContextualHelpFab } from "@/lib/page-contextual-help-fab-paths";
import { cn } from "@/lib/utils";

/** Floating help trigger for high-friction operator workflows (Compare, Replay, Graph, Policy packs). */
export function PageContextualHelpFab(): React.JSX.Element | null {
  const pathname = usePathname() ?? "/";

  if (!pathnameShowsContextualHelpFab(pathname)) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-6 right-6 z-40",
        "max-sm:bottom-4 max-sm:right-4",
      )}
      data-testid="page-contextual-help-fab"
    >
      <div className="pointer-events-auto rounded-full border border-neutral-200 bg-al-surface-raised px-1 py-1 shadow-md dark:border-neutral-700">
        <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
      </div>
    </div>
  );
}
