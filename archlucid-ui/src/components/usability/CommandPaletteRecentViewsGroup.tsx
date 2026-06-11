"use client";

import { useEffect, useState } from "react";

import {
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  OPERATOR_RECENT_VIEWS_STORAGE_KEY,
  parseStoredRecentViews,
  type OperatorRecentViewsState,
} from "@/lib/operator-recent-views";

type CommandPaletteRecentViewsGroupProps = {
  readonly onNavigate: (href: string) => void;
};

/** Surfaces recently viewed reviews and pages inside the command palette (Ctrl/⌘-K). */
export function CommandPaletteRecentViewsGroup(props: CommandPaletteRecentViewsGroupProps) {
  const [state, setState] = useState<OperatorRecentViewsState | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
      setState(parseStoredRecentViews(raw));
    } catch {
      setState(null);
    }
  }, []);

  if (state === null || state.entries.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading="Recently viewed">
      {state.entries.slice(0, 6).map((entry) => (
        <CommandItem
          key={entry.href}
          value={`recent ${entry.label} ${entry.kind} ${entry.href}`}
          onSelect={() => {
            props.onNavigate(entry.href);
          }}
        >
          <span className="font-medium">{entry.label}</span>
          <span className="ml-2 text-xs text-neutral-500">{entry.kind}</span>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
