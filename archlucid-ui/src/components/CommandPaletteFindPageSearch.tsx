import { useCommandState } from "cmdk";

import { CommandGroup, CommandItem } from "@/components/ui/command";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { searchFindPageIndex, searchGuidedLockedFindPageEntries } from "@/lib/find-page-search-index";
import type { GuidedPaletteLockedDestination } from "@/lib/usability/guided-palette-locked-destinations";
import { cn } from "@/lib/utils";

export function CommandPaletteFindPageSearch({
  visibleHrefs,
  lockedDestinations = [],
  onNavigate,
}: {
  visibleHrefs: ReadonlySet<string>;
  lockedDestinations?: readonly GuidedPaletteLockedDestination[];
  onNavigate: (href: string) => void;
}) {
  const search = useCommandState((state) => state.search);
  const trimmed = search.trim();
  const matches = searchFindPageIndex(trimmed, { limit: 8, visibleHrefs });
  const lockedMatches = searchGuidedLockedFindPageEntries(trimmed, lockedDestinations, { limit: 4 });
  const allMatches = [...matches, ...lockedMatches];

  if (trimmed.length === 0 || allMatches.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading="Pages">
      {allMatches.map((entry) => {
        const isLocked = entry.lockReason !== undefined && entry.lockReason.length > 0;

        return (
          <CommandItem
            key={entry.id}
            value={`find-page ${entry.label} ${entry.searchValue}`}
            disabled={isLocked}
            aria-disabled={isLocked ? "true" : undefined}
            onSelect={() => {
              if (!isLocked) {
                onNavigate(entry.href);
              }
            }}
          >
            {isLocked ? (
              <span className="flex min-w-0 flex-col gap-0.5">
                <span>{entry.label}</span>
                <span className={cn(OPERATOR_TYPOGRAPHY.helper, "text-neutral-500")}>{entry.lockReason}</span>
              </span>
            ) : (
              entry.label
            )}
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}
