import { COMMAND_PALETTE_ACTIONS } from "@/lib/command-palette-actions";
import { CommandGroup, CommandItem } from "@/components/ui/command";

export function CommandPaletteActions({ onNavigate }: { onNavigate: (href: string) => void }) {
  return (
    <CommandGroup heading="Actions">
      {COMMAND_PALETTE_ACTIONS.map((action) => (
        <CommandItem
          key={action.id}
          value={`action ${action.label} ${action.searchValue}`}
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
