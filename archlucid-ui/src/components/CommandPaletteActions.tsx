import {
  dispatchCommandPaletteHandlerAction,
  type CommandPaletteHandlerAction,
} from "@/lib/command-palette-handler-actions";
import type { CommandPaletteHrefAction } from "@/lib/command-palette-actions";
import {
  resolveVisibleCommandPaletteHandlerActions,
  resolveVisibleCommandPaletteHrefActions,
} from "@/lib/resolve-visible-command-palette-actions";
import { CommandGroup, CommandItem } from "@/components/ui/command";

export function CommandPaletteActions({
  pathname,
  workingMode,
  onNavigate,
  onClose,
}: {
  readonly pathname: string;
  readonly workingMode: boolean;
  readonly onNavigate: (href: string) => void;
  readonly onClose: () => void;
}) {
  const hrefActions: readonly CommandPaletteHrefAction[] = resolveVisibleCommandPaletteHrefActions(workingMode);
  const handlerActions: readonly CommandPaletteHandlerAction[] =
    resolveVisibleCommandPaletteHandlerActions(pathname);

  if (hrefActions.length === 0 && handlerActions.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading="Actions">
      {handlerActions.map((action) => (
        <CommandItem
          key={action.id}
          value={`action ${action.label} ${action.searchValue}`}
          onSelect={() => {
            dispatchCommandPaletteHandlerAction(action.id);
            onClose();
          }}
        >
          {action.label}
        </CommandItem>
      ))}
      {hrefActions.map((action) => (
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
