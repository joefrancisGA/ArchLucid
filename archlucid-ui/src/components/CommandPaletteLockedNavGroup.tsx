import { CommandGroup, CommandItem } from "@/components/ui/command";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { GuidedPaletteLockedDestination } from "@/lib/usability/guided-palette-locked-destinations";
import { cn } from "@/lib/utils";

export function CommandPaletteLockedNavGroup({
  destinations,
}: {
  readonly destinations: readonly GuidedPaletteLockedDestination[];
}): React.JSX.Element | null {
  if (destinations.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading="Locked until first commit">
      {destinations.map((destination) => (
        <CommandItem
          key={destination.href}
          value={`locked ${destination.label} ${destination.searchValue}`}
          disabled
          aria-disabled="true"
          data-testid={`command-palette-locked-${destination.href.replace(/\//g, "-")}`}
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span>{destination.label}</span>
            <span className={cn(OPERATOR_TYPOGRAPHY.helper, "text-neutral-500")}>
              {destination.lockReason}
            </span>
          </span>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
