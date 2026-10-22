import { useMemo } from "react";

import {
  dispatchCommandPaletteHandlerAction,
  isCommandPaletteReversibleUndoAvailable,
  type CommandPaletteHandlerAction,
} from "@/lib/command-palette-handler-actions";
import type { CommandPaletteHrefAction } from "@/lib/command-palette-actions";
import {
  resolveVisibleCommandPaletteHandlerActions,
  resolveVisibleCommandPaletteHrefActions,
} from "@/lib/resolve-visible-command-palette-actions";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { useEffectiveNavCommittedArchitectureReview } from "@/hooks/use-effective-nav-committed-architecture-review";
import { useRoleNavDensityExpanded } from "@/hooks/use-role-nav-density-expanded";
import { useWorkingCreateStartHref } from "@/hooks/use-working-start-href";
import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { pathIsWorkingInhabitedFindingsRoute } from "@/lib/inhabit/inhabit-help-route";
import { sortInhabitFindingsPaletteHandlerActions } from "@/lib/inhabit/inhabit-palette-findings-rank";

export function CommandPaletteActions({
  paletteOpen,
  pathname,
  workingMode,
  visibleNavHrefs,
  onNavigate,
  onClose,
}: {
  /** Re-query spawn-lock DOM targets when the palette opens (SN-033). */
  readonly paletteOpen: boolean;
  readonly pathname: string;
  readonly workingMode: boolean;
  readonly visibleNavHrefs?: ReadonlySet<string>;
  readonly onNavigate: (href: string) => void;
  readonly onClose: () => void;
}) {
  const hasCommittedArchitectureReview = useEffectiveNavCommittedArchitectureReview();
  const { showFullNav } = useRoleNavDensityExpanded();
  const workingCreateStartHref = useWorkingCreateStartHref();
  const hrefActions: readonly CommandPaletteHrefAction[] = resolveVisibleCommandPaletteHrefActions({
    workingMode,
    hasCommittedArchitectureReview,
    showFullNav,
    workingStartHref: workingCreateStartHref,
    visibleNavHrefs,
    lastOpenArchitectureId: readCachedLastOpenArchitectureId(),
  });
  const handlerActions: readonly CommandPaletteHandlerAction[] = useMemo(() => {
    const resolved = resolveVisibleCommandPaletteHandlerActions(pathname, {
      reversibleUndoAvailable: isCommandPaletteReversibleUndoAvailable(),
    });

    if (workingMode && pathIsWorkingInhabitedFindingsRoute(pathname)) {
      return sortInhabitFindingsPaletteHandlerActions(resolved);
    }

    return resolved;
  }, [pathname, paletteOpen, workingMode]);

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
