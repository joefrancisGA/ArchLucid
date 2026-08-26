import { useCommandState } from "cmdk";

import { CommandGroup, CommandItem } from "@/components/ui/command";
import { searchFindPageIndex } from "@/lib/find-page-search-index";

export function CommandPaletteFindPageSearch({
  visibleHrefs,
  onNavigate,
}: {
  visibleHrefs: ReadonlySet<string>;
  onNavigate: (href: string) => void;
}) {
  const search = useCommandState((state) => state.search);
  const trimmed = search.trim();
  const matches = searchFindPageIndex(trimmed, { limit: 8, visibleHrefs });

  if (trimmed.length === 0 || matches.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading="Pages">
      {matches.map((entry) => (
        <CommandItem
          key={entry.id}
          value={`find-page ${entry.label} ${entry.searchValue}`}
          onSelect={() => {
            onNavigate(entry.href);
          }}
        >
          {entry.label}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
