import { useMemo } from "react";

import { CommandGroup, CommandItem } from "@/components/ui/command";
import { auditTrailNavHref, isAuditNavPath } from "@/lib/audit-nav-paths";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  buildBuyerCommandPaletteCuratedTasks,
} from "@/lib/command-palette-buyer-curated-tasks";
import { buildCommandPaletteCuratedTasks, commandPaletteNavVisibilityHref } from "@/lib/command-palette-curated-tasks";

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
  const { productLine } = useProductLine();

  const curated = useMemo(() => {
    if (buyerPolishedShell) {
      return [...buildBuyerCommandPaletteCuratedTasks(productLine)];
    }

    return buildCommandPaletteCuratedTasks(productLine).filter((task) =>
      visibleHrefs.has(curatedPaletteVisibilityHref(task.href)),
    );
  }, [buyerPolishedShell, productLine, visibleHrefs]);

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
