"use client";

import { useCommandState } from "cmdk";
import { useMemo } from "react";

import { CommandGroup, CommandItem } from "@/components/ui/command";
import { useArchitectureIdentitiesListQuery } from "@/hooks/use-architecture-identities-list-query";
import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";
import {
  commandPaletteOpenArchitectureLabel,
  filterArchitectureIdentitiesForPaletteSearch,
} from "@/lib/command-palette-architecture-identities-search";

type CommandPaletteArchitectureIdentitiesGroupProps = {
  readonly enabled: boolean;
  readonly onNavigate: (href: string) => void;
};

/** Working Ctrl+K quick-open for durable architecture identities (CA-34). */
export function CommandPaletteArchitectureIdentitiesGroup(
  props: CommandPaletteArchitectureIdentitiesGroupProps,
): React.JSX.Element | null {
  const search = useCommandState((state) => state.search);
  const listQuery = useArchitectureIdentitiesListQuery(1, 50);
  const matches = useMemo(
    () => filterArchitectureIdentitiesForPaletteSearch(listQuery.data?.items ?? [], search),
    [listQuery.data?.items, search],
  );

  if (!props.enabled || matches.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading="Architectures">
      {matches.map((item) => (
        <CommandItem
          key={item.architectureId}
          value={`architecture identity ${item.displayName} ${item.architectureId}`}
          onSelect={() => {
            props.onNavigate(architectureIdentityPath(item.architectureId));
          }}
        >
          {commandPaletteOpenArchitectureLabel(item.displayName)}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
