"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCommandState } from "cmdk";
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
} from "@/lib/keyboard-shortcut-display";
import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview, useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { useOperatorShellAuditRunId } from "@/hooks/useOperatorShellAuditRunId";
import { useRoleNavDensityExpanded } from "@/hooks/use-role-nav-density-expanded";
import { auditTrailNavHref, isAuditNavPath } from "@/lib/audit-nav-paths";
import { scopeOperatorShellHrefSet, scopeOperatorShellNavRows } from "@/lib/nav-audit-run-scope";
import { BUYER_COMMAND_PALETTE_CURATED_TASKS } from "@/lib/command-palette-buyer-curated-tasks";
import { COMMAND_PALETTE_ACTIONS } from "@/lib/command-palette-actions";
import { COMMAND_PALETTE_CURATED_TASKS } from "@/lib/command-palette-curated-tasks";
import { DOCUMENTATION_SEARCH_ITEMS, resolveDocumentationHref } from "@/lib/docs-search-index";
import { NAV_GROUPS } from "@/lib/nav-config";
import { isExecutiveDashboardPath } from "@/lib/executive-dashboard-route";
import { resetBuyerCtoDemoSession } from "@/lib/buyer/buyer-cto-demo-orchestration";
import {
  ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT,
} from "@/lib/buyer/buyer-cto-demo-tour";
import {
  COMMAND_PALETTE_RESET_DEMO_LABEL,
  COMMAND_PALETTE_START_CTO_DEMO_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import {
  filterNavGroupsByRoleDensity,
  resolveRoleNavDensityPersona,
  visibleOperatorShellHrefSetFromNavRows,
} from "@/lib/role-shaped-nav-density";
import { applyPatternLibraryHrefSetGate, applyPatternLibraryNavGate } from "@/lib/apply-pattern-library-nav-gate";
import { usePatternLibraryNavVisible } from "@/hooks/use-pattern-library-nav-visible";
import { CommandPaletteRecentViewsGroup } from "@/components/usability/CommandPaletteRecentViewsGroup";
import { CommandPaletteSidebarVocabularyRail } from "@/components/CommandPaletteSidebarVocabularyRail";
import { stampRouteReferrer } from "@/lib/operator/operator-navigation-referrer";
import { OPEN_COMMAND_PALETTE_EVENT, SHORTCUTS } from "@/lib/shortcut-registry";

const RUN_ID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    return "Search governance record";
  }

  const reviewPackageSubtree =
    /^\/architecture\/reviews\/[^/]+(?:\/|$)/u.test(path) ||
    /^\/signed-records\/[^/]/u.test(path) ||
    /^\/architecture\/reviews\/[^/]+\/architecture/u.test(path) ||
    /^\/executive\/reviews\/[^/]/u.test(path);

  if (reviewPackageSubtree) {
    return "Search this review";
  }

  return "Search reviews";
}

function curatedPaletteVisibilityHref(href: string): string {
  const i = href.indexOf("?");

  if (i === -1) {
    return href;
  }

  return href.slice(0, i);
}

function CommandPaletteDocumentationSearch({
  buyerPolishedShell,
  onNavigate,
}: {
  buyerPolishedShell: boolean;
  onNavigate: (href: string) => void;
}) {
  return (
    <CommandGroup heading={buyerPolishedShell ? "Help topics" : "Documentation"}>
      {DOCUMENTATION_SEARCH_ITEMS.map((row) => {
        const href = resolveDocumentationHref(row.relativeDocsPath);

        return (
          <CommandItem
            key={row.relativeDocsPath}
            value={`doc ${row.title} ${row.description} ${row.category} ${row.relativeDocsPath}`}
            className="cursor-pointer"
            onSelect={() => onNavigate(href)}
          >
            {/*
             * Render a real <a> so the browser provides right-click → "Open in new tab",
             * Ctrl+Click, and middle-click. For plain left-clicks we preventDefault and
             * delegate to the SPA router so the dialog closes cleanly.
             */}
            <a
              href={href}
              className="flex w-full items-center"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  e.stopPropagation();
                  onNavigate(href);
                }
              }}
            >
              <span className="font-medium">{row.title}</span>
              <span className={cn("ml-2 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>{row.category}</span>
            </a>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

function CommandPaletteActions({ onNavigate }: { onNavigate: (href: string) => void }) {
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

function CommandPaletteCuratedTasks({
  visibleHrefs,
  buyerPolishedShell,
  auditRunId,
  onNavigate,
}: {
  visibleHrefs: ReadonlySet<string>;
  buyerPolishedShell: boolean;
  auditRunId: string | null;
  onNavigate: (href: string) => void;
}) {
  const curated = useMemo(() => {
    if (buyerPolishedShell) {
      return [...BUYER_COMMAND_PALETTE_CURATED_TASKS];
    }

    return COMMAND_PALETTE_CURATED_TASKS.filter((task) => visibleHrefs.has(curatedPaletteVisibilityHref(task.href)));
  }, [buyerPolishedShell, visibleHrefs]);

  if (curated.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading={buyerPolishedShell ? "Shortcuts" : "Quick tasks"}>
      {curated.map((task) => {
        const href = isAuditNavPath(task.href.split("?")[0] ?? "")
          ? auditTrailNavHref(auditRunId)
          : task.href;

        return (
        <CommandItem
          key={`curated-${task.href}`}
          value={`quick ${task.label} ${task.searchValue}`}
          onSelect={() => {
            onNavigate(href);
          }}
        >
          {task.label}
        </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

function buyerPaletteNavGroupHeading(groupId: string, defaultLabel: string): string {
  if (groupId === "pilot") {
    return "Reviews";
  }

  if (groupId === "operate-analysis") {
    return "Trace & exploration";
  }

  return defaultLabel;
}

function CommandPaletteNavGroups({
  callerAuthorityRank,
  shellShowExtended,
  shellShowAdvanced,
  hasCommittedArchitectureReview,
  buyerPolishedShell,
  auditRunId,
  patternLibraryNavVisible,
  roleNavDensityPersona,
  roleNavDensityShowFullNav,
  onNavigate,
}: {
  callerAuthorityRank: number;
  shellShowExtended: boolean;
  shellShowAdvanced: boolean;
  hasCommittedArchitectureReview: boolean;
  buyerPolishedShell: boolean;
  auditRunId: string | null;
  patternLibraryNavVisible: boolean;
  roleNavDensityPersona: ReturnType<typeof resolveRoleNavDensityPersona>;
  roleNavDensityShowFullNav: boolean;
  onNavigate: (href: string) => void;
}) {
  const search = useCommandState((state) => state.search);
  const showAdminPalette = search.trim().length > 0;

  const reviewRows = filterNavGroupsByRoleDensity(
    applyPatternLibraryNavGate(
      scopeOperatorShellNavRows(
        listNavGroupsVisibleInOperatorShell(
          NAV_GROUPS,
          shellShowExtended,
          shellShowAdvanced,
          callerAuthorityRank,
          false,
          "review-workflow",
          hasCommittedArchitectureReview,
        ),
        auditRunId,
      ),
      patternLibraryNavVisible,
    ),
    roleNavDensityPersona,
    roleNavDensityShowFullNav,
  );

  const adminRows = filterNavGroupsByRoleDensity(
    applyPatternLibraryNavGate(
      scopeOperatorShellNavRows(
        listNavGroupsVisibleInOperatorShell(
          NAV_GROUPS,
          shellShowExtended,
          shellShowAdvanced,
          callerAuthorityRank,
          false,
          "platform-admin",
          hasCommittedArchitectureReview,
        ),
        auditRunId,
      ),
      patternLibraryNavVisible,
    ),
    roleNavDensityPersona,
    roleNavDensityShowFullNav,
  );

  const systemAdminRows = filterNavGroupsByRoleDensity(
    isShowSystemAdministrationNavEnabled()
      ? listNavGroupsVisibleInOperatorShell(
          NAV_GROUPS,
          shellShowExtended,
          shellShowAdvanced,
          callerAuthorityRank,
          false,
          "system-admin",
          hasCommittedArchitectureReview,
        )
      : [],
    roleNavDensityPersona,
    roleNavDensityShowFullNav,
  );

  return (
    <>
      {reviewRows.map(({ group, visibleLinks }) => (
        <CommandGroup
          key={group.id}
          heading={buyerPolishedShell ? buyerPaletteNavGroupHeading(group.id, group.label) : group.label}
        >
          {visibleLinks.map((link) => (
            <CommandItem
              key={link.href}
              value={`${link.label} ${link.href}`}
              onSelect={() => {
                onNavigate(link.href);
              }}
            >
              {link.label}
            </CommandItem>
          ))}
        </CommandGroup>
      ))}
      {showAdminPalette
        ? adminRows.map(({ group, visibleLinks }) => (
            <CommandGroup
              key={`palette-${group.id}`}
              heading={group.id === "operator-admin" ? "Administration" : group.label}
            >
              {visibleLinks.map((link) => (
                <CommandItem
                  key={link.href}
                  value={`administration ${link.label} ${link.href}`}
                  onSelect={() => {
                    onNavigate(link.href);
                  }}
                >
                  {link.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))
        : null}
      {showAdminPalette
        ? systemAdminRows.map(({ group, visibleLinks }) => (
            <CommandGroup key={`palette-${group.id}`} heading={group.label}>
              {visibleLinks.map((link) => (
                <CommandItem
                  key={link.href}
                  value={`internal operations ${link.label} ${link.href}`}
                  onSelect={() => {
                    onNavigate(link.href);
                  }}
                >
                  {link.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))
        : null}
    </>
  );
}

function CommandPaletteDemoActions({
  onNavigate,
  onClose,
}: {
  onNavigate: (href: string) => void;
  onClose: () => void;
}) {
  if (!isCtoDemoPackEnv()) {
    return null;
  }

  return (
    <CommandGroup heading="CTO demo">
      <CommandItem
        value={`demo ${COMMAND_PALETTE_START_CTO_DEMO_LABEL} tour start`}
        onSelect={() => {
          onClose();
          window.dispatchEvent(new Event(ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT));
        }}
      >
        {COMMAND_PALETTE_START_CTO_DEMO_LABEL}
      </CommandItem>
      <CommandItem
        value={`demo ${COMMAND_PALETTE_RESET_DEMO_LABEL} reset showcase`}
        onSelect={() => {
          onClose();
          void resetBuyerCtoDemoSession().then((result) => {
            onNavigate(result.destinationHref);
          });
        }}
      >
        {COMMAND_PALETTE_RESET_DEMO_LABEL}
      </CommandItem>
    </CommandGroup>
  );
}

function RunIdQuickOpen({
  onNavigate,
  allowRunIdPaste,
}: {
  onNavigate: (href: string) => void;
  allowRunIdPaste: boolean;
}) {
  const search = useCommandState((state) => state.search);
  const trimmed = search.trim();

  if (!allowRunIdPaste || !RUN_ID_LIKE.test(trimmed)) {
    return null;
  }

  return (
    <CommandGroup heading="Quick open">
      <CommandItem
        value={`open-review-${trimmed}`}
        onSelect={() => {
          onNavigate(`/architecture/reviews/${trimmed}`);
        }}
      >
        Open linked review
      </CommandItem>
    </CommandGroup>
  );
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
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const { currentPrincipal } = useOperatorNavAuthority();
  const { showFullNav: roleNavDensityShowFullNav } = useRoleNavDensityExpanded();
  const roleNavDensityPersona = resolveRoleNavDensityPersona(currentPrincipal.roleClaimValues);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const paletteExtended = true;
  const paletteAdvanced = true;
  const patternLibraryNavVisible = usePatternLibraryNavVisible();

  const visibleHrefs = useMemo(() => {
    const shellRows = applyPatternLibraryNavGate(
      scopeOperatorShellNavRows(
        listNavGroupsVisibleInOperatorShell(
          NAV_GROUPS,
          paletteExtended,
          paletteAdvanced,
          callerAuthorityRank,
          false,
          "all",
          hasCommittedArchitectureReview,
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
      scopeOperatorShellHrefSet(
        visibleOperatorShellHrefSetFromNavRows(densityFilteredRows),
        auditRunId,
      ),
      patternLibraryNavVisible,
    );
  }, [
    auditRunId,
    paletteExtended,
    paletteAdvanced,
    callerAuthorityRank,
    hasCommittedArchitectureReview,
    patternLibraryNavVisible,
    roleNavDensityPersona,
    roleNavDensityShowFullNav,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;

      if (
        !open &&
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          (target instanceof HTMLElement && target.isContentEditable))
      ) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
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
      return "Jump to audit, signed review record, governance, or type another destination…";
    }

    if (path.startsWith("/insights/ask-review-questions")) {
      return "Jump to executive summary, signed review record, evidence trail, or governance…";
    }

    if (path.startsWith("/insights/compare-two-reviews")) {
      return "Jump to review, signed review record, or evidence trail…";
    }

    if (path.startsWith("/audit")) {
      return "Jump to executive summary, evidence graph, signed review record — or type a destination…";
    }

    if (path.startsWith("/governance")) {
      return "Jump to audit trail, findings, executive summary…";
    }

    if (isExecutiveDashboardPath(path)) {
      return "Jump to signed review record, evidence graph, audit…";
    }

    if (path.startsWith("/signed-records") || path.includes("/architecture")) {
      return "Jump to executive summary, graph, governance…";
    }

    return "Find another page in this review…";
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
              ? (cn("h-8 gap-1.5 border-neutral-300 bg-white px-2.5 font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper))
              : cn(
                  "h-8 gap-1.5 border-dashed border-neutral-400 bg-neutral-50/90 px-2.5 font-mono font-semibold tracking-tight text-neutral-800 shadow-sm hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900/80 dark:text-neutral-100 dark:hover:bg-neutral-800",
                  OPERATOR_TYPOGRAPHY.tab,
                )
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
        <div className="px-3 pt-2">
          <CommandPaletteSidebarVocabularyRail currentSurfaceId="command-palette" />
        </div>
        <CommandList>
          <RunIdQuickOpen onNavigate={navigate} allowRunIdPaste={!buyerPolishedShell} />
          <CommandPaletteRecentViewsGroup onNavigate={navigate} />
          <CommandPaletteDocumentationSearch buyerPolishedShell={buyerPolishedShell} onNavigate={navigate} />
          <CommandPaletteActions onNavigate={navigate} />
          <CommandPaletteDemoActions onNavigate={navigate} onClose={() => setOpen(false)} />
          <CommandPaletteCuratedTasks
            visibleHrefs={visibleHrefs}
            buyerPolishedShell={buyerPolishedShell}
            auditRunId={auditRunId}
            onNavigate={navigate}
          />
          <CommandEmpty>
            {buyerPolishedShell
              ? "No matching page. Try another search."
              : "No matching pages. Try another search or paste a review ID."}
          </CommandEmpty>
          <CommandPaletteNavGroups
            callerAuthorityRank={callerAuthorityRank}
            shellShowExtended={paletteExtended}
            shellShowAdvanced={paletteAdvanced}
            hasCommittedArchitectureReview={hasCommittedArchitectureReview}
            buyerPolishedShell={buyerPolishedShell}
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
