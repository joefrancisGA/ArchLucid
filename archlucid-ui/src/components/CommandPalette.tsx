"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";

import { KeyboardShortcutBadge } from "@/components/KeyboardShortcutBadge";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  COMMAND_PALETTE_ARIA_KEYSHORTCUTS,
  commandPaletteOpenAriaLabel,
  isApplePlatformShortcutModifier,
} from "@/lib/keyboard-shortcut-display";
import { useNavCallerAuthorityRank, useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { useOperatorShellAuditRunId } from "@/hooks/useOperatorShellAuditRunId";
import { useEffectiveNavCommittedArchitectureReview } from "@/hooks/use-effective-nav-committed-architecture-review";
import { useRoleNavDensityExpanded } from "@/hooks/use-role-nav-density-expanded";
import { scopeOperatorShellHrefSet, scopeOperatorShellNavRows } from "@/lib/nav-audit-run-scope";
import { NAV_GROUPS } from "@/lib/nav-config";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { mergeContextualOnlyOperatorNavHrefsIntoVisibleSet } from "@/lib/nav-contextual-only-operator-paths";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { isArchLucidVendorStaffPrincipal } from "@/lib/vendor-staff-principal";
import {
  filterNavGroupsByRoleDensity,
  resolveRoleNavDensityPersona,
  visibleOperatorShellHrefSetFromNavRows,
} from "@/lib/role-shaped-nav-density";
import { applyPatternLibraryHrefSetGate, applyPatternLibraryNavGate } from "@/lib/apply-pattern-library-nav-gate";
import { usePatternLibraryNavVisible } from "@/hooks/use-pattern-library-nav-visible";
import { CommandPaletteRecentViewsGroup } from "@/components/usability/CommandPaletteRecentViewsGroup";
import { COMMAND_PALETTE_SIDEBAR_COMPACT_LINE } from "@/lib/vocabulary/command-palette-sidebar-vocabulary";
import { stampRouteReferrer } from "@/lib/operator/operator-navigation-referrer";
import {
  resolveShellHeaderSearchLabel,
  resolveShellHeaderSearchPlaceholder,
} from "@/lib/shell-header-search-label";
import {
  OPEN_COMMAND_PALETTE_EVENT,
  SHORTCUTS,
  type OpenCommandPaletteEventDetail,
} from "@/lib/shortcut-registry";
import { CommandPaletteActions } from "@/components/CommandPaletteActions";
import { CommandPaletteArchitectureIdentitiesGroup } from "@/components/CommandPaletteArchitectureIdentitiesGroup";
import { consumePendingCommandPaletteOpen } from "@/lib/command-palette-open-intent";
import { CommandPaletteAdminNavGroups } from "@/components/CommandPaletteAdminNavGroups";
import { CommandPaletteCuratedTasks } from "@/components/CommandPaletteCuratedTasks";
import { CommandPaletteDemoActions } from "@/components/CommandPaletteDemoActions";
import { CommandPaletteDocumentationSearch } from "@/components/CommandPaletteDocumentationSearch";
import { CommandPaletteFindPageSearch } from "@/components/CommandPaletteFindPageSearch";
import { CommandPaletteReviewActions } from "@/components/CommandPaletteReviewActions";
import { RunIdQuickOpen } from "@/components/RunIdQuickOpen";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { filterNavGroupsForWorkingProfessionalMode } from "@/lib/workspace-mode/working-mode-nav-filter";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import {
  commandPaletteOverlayHrefFromSearch,
  parseCommandPaletteOpenFromSearch,
  parseCommandPaletteQueryFromSearch,
} from "@/lib/operator/command-palette-overlay-url";

/** Buyer-polished header search: route-aware label for the Ctrl+K command palette trigger. */
function buyerPolishedCommandPaletteLabel(pathname: string): string {
  return resolveShellHeaderSearchLabel(pathname);
}

function isEditableEventTarget(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return true;
  }

  return target instanceof HTMLElement && target.isContentEditable;
}

/**
 * True when this keypress should toggle the palette.
 *
 * The shortcut deliberately stays live while a text field has focus: the header search box is the
 * first place a reader hunting for the palette lands, and suppressing the shortcut there hid the
 * palette from exactly that person. The one exception is Apple platforms, where Ctrl+K inside a
 * field is the "kill to end of line" binding — there, only Cmd+K opens the palette.
 */
export function palettePressUsesPaletteModifier(
  event: Pick<KeyboardEvent, "ctrlKey" | "metaKey">,
  target: EventTarget | null,
): boolean {
  if (!event.ctrlKey && !event.metaKey) {
    return false;
  }

  if (isEditableEventTarget(target) && isApplePlatformShortcutModifier()) {
    return event.metaKey;
  }

  return true;
}

/**
 * Ctrl+K command palette (metaKey+K on macOS): jump to operator pages surfaced in nav config.
 * Uses **`listNavGroupsVisibleInOperatorShell`** (tier → authority, omit empty groups) — same as sidebar and mobile drawer.
 * Optional run UUID quick-open is unchanged.
 */
export type CommandPaletteProps = {
  /** When false, only the dialog and keyboard shortcut are rendered (header uses GlobalSearchBar for the visible affordance). */
  readonly showTrigger?: boolean;
};

export function CommandPalette({ showTrigger = false }: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const paletteOpenParam = searchParams.get("paletteOpen");
  const paletteQueryParam = searchParams.get("paletteQ");
  const [open, setOpenState] = useState(() => parseCommandPaletteOpenFromSearch(paletteOpenParam));
  const [paletteQuery, setPaletteQueryState] = useState(() => parseCommandPaletteQueryFromSearch(paletteQueryParam));
  const auditRunId = useOperatorShellAuditRunId();
  // Tier disclosure retired: palette lists every authority-eligible href (same as sidebar).
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const effectiveHasCommittedArchitectureReview = useEffectiveNavCommittedArchitectureReview();
  const { currentPrincipal } = useOperatorNavAuthority();
  const { showFullNav: roleNavDensityShowFullNav } = useRoleNavDensityExpanded();
  const roleNavDensityPersona = resolveRoleNavDensityPersona(currentPrincipal.roleClaimValues);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const patternLibraryNavVisible = usePatternLibraryNavVisible();
  const { mode } = useWorkspaceMode();
  const workingMode = isWorkingWorkspaceMode(mode);
  const showVendorInternalNav = isArchLucidVendorStaffPrincipal(currentPrincipal);

  const visibleHrefs = useMemo(() => {
    const shellRows = applyPatternLibraryNavGate(
      scopeOperatorShellNavRows(
        listNavGroupsVisibleInOperatorShell(
          NAV_GROUPS,
          callerAuthorityRank,
          "all",
          effectiveHasCommittedArchitectureReview,
          false,
          { showVendorInternalNav },
        ),
        auditRunId,
      ),
      patternLibraryNavVisible,
    );
    const densityFilteredRows = filterNavGroupsByRoleDensity(
      shellRows,
      roleNavDensityPersona,
      roleNavDensityShowFullNav,
    );
    const workingFilteredRows = workingMode
      ? filterNavGroupsForWorkingProfessionalMode(densityFilteredRows)
      : densityFilteredRows;

    return applyPatternLibraryHrefSetGate(
      mergeContextualOnlyOperatorNavHrefsIntoVisibleSet(
        scopeOperatorShellHrefSet(
          visibleOperatorShellHrefSetFromNavRows(workingFilteredRows),
          auditRunId,
        ),
        callerAuthorityRank,
      ),
      patternLibraryNavVisible,
    );
  }, [
    auditRunId,
    callerAuthorityRank,
    effectiveHasCommittedArchitectureReview,
    patternLibraryNavVisible,
    roleNavDensityPersona,
    roleNavDensityShowFullNav,
    showVendorInternalNav,
    workingMode,
  ]);

  const syncCommandPaletteToUrl = useCallback(
    (nextOpen: boolean, nextQuery: string) => {
      router.replace(
        commandPaletteOverlayHrefFromSearch(
          searchParams.toString(),
          { open: nextOpen, query: nextQuery },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback((value: SetStateAction<boolean>) => {
    setOpenState((current) => {
      return typeof value === "function" ? value(current) : value;
    });
  }, []);

  const setPaletteQuery = useCallback((value: SetStateAction<string>) => {
    setPaletteQueryState((current) => {
      return typeof value === "function" ? value(current) : value;
    });
  }, []);

  useEffect(() => {
    const queryForUrl = open ? paletteQuery : "";

    if (!open && paletteQuery !== "") {
      setPaletteQueryState("");
    }

    const nextHref = commandPaletteOverlayHrefFromSearch(
      searchParams.toString(),
      { open, query: queryForUrl },
      pathname,
    );
    const currentSearch = searchParams.toString();
    const currentHref = currentSearch.length === 0 ? pathname : `${pathname}?${currentSearch}`;

    if (nextHref !== currentHref) {
      syncCommandPaletteToUrl(open, queryForUrl);
    }
  }, [open, paletteQuery, pathname, searchParams, syncCommandPaletteToUrl]);

  useEffect(() => {
    const pending = consumePendingCommandPaletteOpen();

    if (pending === null) {
      return;
    }

    const initialQuery = pending.initialQuery?.trim() ?? "";

    if (initialQuery.length > 0) {
      setPaletteQuery(initialQuery);
    }

    setOpen(true);
  }, [setOpen, setPaletteQuery]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key?.toLowerCase() !== "k") {
        return;
      }

      if (!palettePressUsesPaletteModifier(event, event.target)) {
        return;
      }

      event.preventDefault();
      setOpen((previous) => !previous);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  useEffect(() => {
    const onOpenRequest = (event: Event): void => {
      const detail = (event as CustomEvent<OpenCommandPaletteEventDetail>).detail;
      const initialQuery = detail?.initialQuery?.trim() ?? "";

      if (initialQuery.length > 0) {
        setPaletteQuery(initialQuery);
      }

      setOpen(true);
    };

    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenRequest);

    return () => {
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenRequest);
    };
  }, [setOpen, setPaletteQuery]);

  const navigate = useCallback(
    (href: string) => {
      stampRouteReferrer("palette");
      setOpen(false);
      router.push(href);
    },
    [router, setOpen],
  );

  const polishedPaletteLabel = useMemo(() => buyerPolishedCommandPaletteLabel(pathname ?? ""), [pathname]);

  const polishedPalettePlaceholder = useMemo(() => {
    return resolveShellHeaderSearchPlaceholder(pathname ?? "");
  }, [pathname]);

  return (
    <>
      {showTrigger ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={
            buyerPolishedShell
              ? "h-8 gap-1.5 border-neutral-300 bg-white px-2.5 text-neutral-800 shadow-sm hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
              : "h-8 gap-1.5 border-dashed border-neutral-400 bg-neutral-50/90 px-2.5 font-mono tracking-tight text-neutral-800 shadow-sm hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900/80 dark:text-neutral-100 dark:hover:bg-neutral-800"
          }
          aria-label={
            buyerPolishedShell
              ? commandPaletteOpenAriaLabel(polishedPaletteLabel)
              : commandPaletteOpenAriaLabel("Open command palette")
          }
          aria-keyshortcuts={COMMAND_PALETTE_ARIA_KEYSHORTCUTS}
          onClick={() => {
            setOpen(true);
          }}
        >
          {buyerPolishedShell ? (
            <>
              <span className="truncate">{polishedPaletteLabel}</span>
              <KeyboardShortcutBadge className="shrink-0" />
            </>
          ) : (
            <>
              <KeyboardShortcutBadge />
              <span>Search</span>
            </>
          )}
        </Button>
      ) : null}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        searchValue={paletteQuery}
        onSearchValueChange={setPaletteQuery}
      >
        <CommandInput
          placeholder={buyerPolishedShell ? polishedPalettePlaceholder : "Search pages or paste a review ID…"}
        />
        <CommandList>
          <RunIdQuickOpen onNavigate={navigate} allowRunIdPaste={!buyerPolishedShell} />
          <CommandPaletteArchitectureIdentitiesGroup enabled={workingMode} onNavigate={navigate} />
          <CommandPaletteRecentViewsGroup onNavigate={navigate} />
          <CommandPaletteFindPageSearch visibleHrefs={visibleHrefs} onNavigate={navigate} />
          <CommandPaletteDocumentationSearch buyerPolishedShell={buyerPolishedShell} onNavigate={navigate} />
          <CommandPaletteActions
            pathname={pathname ?? "/"}
            workingMode={workingMode}
            visibleNavHrefs={visibleHrefs}
            onNavigate={navigate}
            onClose={() => {
              setOpen(false);
            }}
          />
          <CommandPaletteReviewActions runId={auditRunId} onNavigate={navigate} />
          <CommandPaletteDemoActions onNavigate={navigate} onClose={() => setOpen(false)} />
          <CommandPaletteCuratedTasks
            visibleHrefs={visibleHrefs}
            buyerPolishedShell={buyerPolishedShell}
            auditRunId={auditRunId}
            onNavigate={navigate}
          />
          <CommandEmpty>
            {buyerPolishedShell ? (
              <>
                <p className="m-0">{COMMAND_PALETTE_SIDEBAR_COMPACT_LINE}</p>
                <p className="m-0 mt-2">No matching page. Try another search.</p>
              </>
            ) : (
              <>
                <p className="m-0">{COMMAND_PALETTE_SIDEBAR_COMPACT_LINE}</p>
                <p className="m-0 mt-2">No matching pages. Try another search or paste a review ID.</p>
              </>
            )}
          </CommandEmpty>
          <CommandPaletteAdminNavGroups
            callerAuthorityRank={callerAuthorityRank}
            hasCommittedArchitectureReview={effectiveHasCommittedArchitectureReview}
            auditRunId={auditRunId}
            patternLibraryNavVisible={patternLibraryNavVisible}
            roleNavDensityPersona={roleNavDensityPersona}
            roleNavDensityShowFullNav={roleNavDensityShowFullNav}
            showVendorInternalNav={showVendorInternalNav}
            onNavigate={navigate}
          />
          {buyerPolishedShell ? null : (
            <>
              <CommandSeparator />
              <CommandGroup heading="Keyboard shortcuts (navigation)">
                {SHORTCUTS.filter((entry) => entry.route !== undefined && entry.route !== "").map((entry) => (
                  <CommandItem
                    key={entry.key}
                    value={`${entry.label} ${entry.key}`}
                    onSelect={() => {
                      if (entry.route) {
                        navigate(entry.route);
                      }
                    }}
                  >
                    {entry.label}{" "}
                    <span className={cn("ml-1 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>({entry.key})</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
