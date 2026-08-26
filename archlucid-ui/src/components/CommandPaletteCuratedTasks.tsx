import { useMemo } from "react";

import { CommandGroup, CommandItem } from "@/components/ui/command";
import { auditTrailNavHref, isAuditNavPath } from "@/lib/audit-nav-paths";
import { BUYER_COMMAND_PALETTE_CURATED_TASKS } from "@/lib/command-palette-buyer-curated-tasks";
import { COMMAND_PALETTE_CURATED_TASKS, commandPaletteNavVisibilityHref } from "@/lib/command-palette-curated-tasks";

function curatedPaletteVisibilityHref(href: string): string {
  return commandPaletteNavVisibilityHref(href);
}

export function CommandPaletteCuratedTasks({
  visibleHrefs,
  buyerPolishedShell,
  auditRunId,
  onNavigate,
}: {
  visibleHrefs: ReadonlySet<string>;
  buyerPolishedShell: boolean;
  auditRunId: string | null;
  onNavigate: (href: string) => void;
}) {
  const curated = useMemo(() => {
    if (buyerPolishedShell) {
      return [...BUYER_COMMAND_PALETTE_CURATED_TASKS];
    }

    return COMMAND_PALETTE_CURATED_TASKS.filter((task) => visibleHrefs.has(curatedPaletteVisibilityHref(task.href)));
  }, [buyerPolishedShell, visibleHrefs]);

  if (curated.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading={buyerPolishedShell ? "Shortcuts" : "Quick tasks"}>
      {curated.map((task) => {
        const href = isAuditNavPath(task.href.split("?")[0] ?? "")
          ? auditTrailNavHref(auditRunId)
          : task.href;

        return (
        <CommandItem
          key={`curated-${task.href}`}
          value={`quick ${task.label} ${task.searchValue}`}
          onSelect={() => {
            onNavigate(href);
          }}
        >
          {task.label}
        </CommandItem>
        );
      })}
    </CommandGroup>
  );
}
