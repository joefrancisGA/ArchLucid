"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import { isSponsorDashboardPath } from "@/lib/sponsor-dashboard-route";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { mergeContextualOnlyOperatorNavHrefsIntoVisibleSet } from "@/lib/nav-contextual-only-operator-paths";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
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
import { GLOBAL_FIND_PAGE_SEARCH } from "@/lib/search-surface-disambiguation";
import { OPEN_COMMAND_PALETTE_EVENT, SHORTCUTS } from "@/lib/shortcut-registry";
import { CommandPaletteActions } from "@/components/CommandPaletteActions";
import { CommandPaletteAdminNavGroups } from "@/components/CommandPaletteAdminNavGroups";
import { CommandPaletteCuratedTasks } from "@/components/CommandPaletteCuratedTasks";
import { CommandPaletteDemoActions } from "@/components/CommandPaletteDemoActions";
import { CommandPaletteDocumentationSearch } from "@/components/CommandPaletteDocumentationSearch";
import { CommandPaletteFindPageSearch } from "@/components/CommandPaletteFindPageSearch";
import { CommandPaletteReviewActions } from "@/components/CommandPaletteReviewActions";
import { RunIdQuickOpen } from "@/components/RunIdQuickOpen";

/** Buyer-polished header search: route-aware label for the Ctrl+K command palette trigger. */
function buyerPolishedCommandPaletteLabel(pathname: string): string {
  const path = (pathname ?? "").split("?")[0] ?? "";

  if (path.startsWith("/insights/evidence-graph")) {
    return "Search evidence trail";
  }

  if (path.startsWith("/insights/ask-review-questions")) {
    return "Search review evidence";
  }

  if (path.startsWith("/audit")) {
    return "Search audit trail";
  }

  if (path.startsWith("/insights/compare-two-reviews")) {
    return "Search review change comparison";
  }

  if (path.startsWith("/governance")) {
    return "Search policy record";
  }

  const reviewPackageSubtree =
    /^\/architecture\/reviews\/[^/]+(?:\/|$)/u.test(path) ||
    /^\/(?:governance\/)?(?:signed|sealed)-records\/[^/]/u.test(path) ||
    /^\/architecture\/reviews\/[^/]+\/architecture/u.test(path) ||
    /^\/sponsor\/reviews\/[^/]/u.test(path);

  if (reviewPackageSubtree) {
    return "Search this review";
  }

  return "Search reviews";
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
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const auditRunId = useOperatorShellAuditRunId();
  // Tier disclosure retired: palette lists every authority-eligible href (same as sidebar).
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const effectiveHasCommittedArchitectureReview = useEffectiveNavCommittedArchitectureReview();
  const { currentPrincipal } = useOperatorNavAuthority();
  const { showFullNav: roleNavDensityShowFullNav } = useRoleNavDensityExpanded();
  const roleNavDensityPersona = resolveRoleNavDensityPersona(currentPrincipal.roleClaimValues);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const patternLibraryNavVisible = usePatternLibraryNavVisible();

  const visibleHrefs = useMemo(() => {
    const shellRows = applyPatternLibraryNavGate(
      scopeOperatorShellNavRows(
        listNavGroupsVisibleInOperatorShell(
          NAV_GROUPS,
          callerAuthorityRank,
          "all",
          effectiveHasCommittedArchitectureReview,
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

    return applyPatternLibraryHrefSetGate(
      mergeContextualOnlyOperatorNavHrefsIntoVisibleSet(
        scopeOperatorShellHrefSet(
          visibleOperatorShellHrefSetFromNavRows(densityFilteredRows),
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
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k") {
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
  }, [open]);

  useEffect(() => {
    const onOpenRequest = (): void => {
      setOpen(true);
    };

    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenRequest);

    return () => {
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenRequest);
    };
  }, []);

  const navigate = useCallback(
    (href: string) => {
      stampRouteReferrer("palette");
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const polishedPaletteLabel = useMemo(() => buyerPolishedCommandPaletteLabel(pathname ?? ""), [pathname]);

  const polishedPalettePlaceholder = useMemo(() => {
    const path = (pathname ?? "").split("?")[0] ?? "";

    if (path.startsWith("/insights/evidence-graph")) {
      return "Jump to audit, finalized review record, governance, or type another destination…";
    }

    if (path.startsWith("/insights/ask-review-questions")) {
      return "Jump to sponsor report, finalized review record, evidence trail, or governance…";
    }

    if (path.startsWith("/insights/compare-two-reviews")) {
      return "Jump to review, finalized review record, or evidence trail…";
    }

    if (path.startsWith("/audit")) {
      return "Jump to sponsor report, evidence graph, finalized review record — or type a destination…";
    }

    if (path.startsWith("/governance")) {
      return "Jump to audit trail, findings, sponsor report…";
    }

    if (isSponsorDashboardPath(path)) {
      return "Jump to finalized review record, evidence graph, audit…";
    }

    if (path.startsWith("/signed-records") || path.includes("/architecture")) {
      return "Jump to sponsor report, graph, governance…";
    }

    return GLOBAL_FIND_PAGE_SEARCH.placeholder;
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
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={buyerPolishedShell ? polishedPalettePlaceholder : "Search pages or paste a review ID…"} />
        <CommandList>
          <RunIdQuickOpen onNavigate={navigate} allowRunIdPaste={!buyerPolishedShell} />
          <CommandPaletteRecentViewsGroup onNavigate={navigate} />
          <CommandPaletteFindPageSearch visibleHrefs={visibleHrefs} onNavigate={navigate} />
          <CommandPaletteDocumentationSearch buyerPolishedShell={buyerPolishedShell} onNavigate={navigate} />
          <CommandPaletteActions onNavigate={navigate} />
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
