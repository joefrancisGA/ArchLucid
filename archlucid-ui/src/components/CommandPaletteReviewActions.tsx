import { useMemo } from "react";

import { CommandGroup, CommandItem } from "@/components/ui/command";
import { buildCommandPaletteReviewActions } from "@/lib/command-palette-review-actions";

export function CommandPaletteReviewActions({
  runId,
  onNavigate,
}: {
  runId: string | null;
  onNavigate: (href: string) => void;
}) {
  const actions = useMemo(() => buildCommandPaletteReviewActions(runId), [runId]);

  if (actions.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading="This review">
      {actions.map((action) => (
        <CommandItem
          key={action.id}
          value={`review ${action.label} ${action.searchValue}`}
          onSelect={() => {
            onNavigate(action.href);
          }}
        >
          {action.label}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
