"use client";

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
import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useNavProgressiveDisclosure } from "@/hooks/useNavProgressiveDisclosure";
import { useGovernanceMode } from "@/hooks/use-governance-mode";
import { BUYER_COMMAND_PALETTE_CURATED_TASKS } from "@/lib/command-palette-buyer-curated-tasks";
import { COMMAND_PALETTE_ACTIONS } from "@/lib/command-palette-actions";
import { COMMAND_PALETTE_CURATED_TASKS } from "@/lib/command-palette-curated-tasks";
import { DOCUMENTATION_SEARCH_ITEMS, resolveDocumentationHref } from "@/lib/docs-search-index";
import { NAV_GROUPS } from "@/lib/nav-config";
import { effectiveNavDisclosureForPathname } from "@/lib/nav-disclosure-for-path";
import { resetBuyerCtoDemoSession } from "@/lib/buyer-cto-demo-orchestration";
import {
  ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT,
  getStartCtoDemoTourHref,
} from "@/lib/buyer-cto-demo-tour";
import {
  COMMAND_PALETTE_RESET_DEMO_LABEL,
  COMMAND_PALETTE_START_CTO_DEMO_LABEL,
} from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { filterNavGroupsForGovernanceMode, isGovernanceModeHiddenNavHref } from "@/lib/governance-mode-nav-filter";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import { listNavGroupsVisibleInOperatorShell, visibleOperatorShellHrefSet } from "@/lib/nav-shell-visibility";
import { operateNavUnlockPhaseForAdvancedFeatures } from "@/lib/usability/operate-advanced-features-disclosure";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { CommandPaletteRecentViewsGroup } from "@/components/usability/CommandPaletteRecentViewsGroup";
import { OPEN_COMMAND_PALETTE_EVENT, SHORTCUTS } from "@/lib/shortcut-registry";

const RUN_ID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Buyer-polished header search: route-aware label for the Ctrl+K command palette trigger. */
function buyerPolishedCommandPaletteLabel(pathname: string): string {
  const path = (pathname ?? "").split("?")[0] ?? "";

  if (path.startsWith("/graph")) {
    return "Search evidence trail";
  }

  if (path.startsWith("/ask")) {
    return "Search review evidence";
  }

  if (path.startsWith("/audit")) {
    return "Search audit trail";
  }

  if (path.startsWith("/compare")) {
    return "Search review change comparison";
  }

  if (path.startsWith("/governance")) {
    return "Search governance record";
  }

  const reviewPackageSubtree =
    /^\/reviews\/[^/]+(?:\/|$)/u.test(path) ||
    /^\/manifests\/[^/]/u.test(path) ||
    /^\/executive\/reviews\/[^/]/u.test(path);

  if (reviewPackageSubtree) {
    return "Search this review package";
  }

  return "Search review packages";
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
              <span className="ml-2 text-xs text-neutral-500">{row.category}</span>
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
  onNavigate,
}: {
  visibleHrefs: ReadonlySet<string>;
  buyerPolishedShell: boolean;
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
      {curated.map((task) => (
        <CommandItem
          key={`curated-${task.href}`}
          value={`quick ${task.label} ${task.searchValue}`}
          onSelect={() => {
            onNavigate(task.href);
          }}
        >
          {task.label}
        </CommandItem>
      ))}
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
  operateNavUnlockPhase,
  isGovernanceModeEnabled,
  onNavigate,
}: {
  callerAuthorityRank: number;
  shellShowExtended: boolean;
  shellShowAdvanced: boolean;
  hasCommittedArchitectureReview: boolean;
  buyerPolishedShell: boolean;
  operateNavUnlockPhase: ReturnType<typeof operateNavUnlockPhaseForAdvancedFeatures>;
  isGovernanceModeEnabled: boolean;
  onNavigate: (href: string) => void;
}) {
  const search = useCommandState((state) => state.search);
  const showAdminPalette = search.trim().length > 0;

  const reviewRows = filterNavGroupsForGovernanceMode(
    listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      shellShowExtended,
      shellShowAdvanced,
      callerAuthorityRank,
      false,
      "review-workflow",
      hasCommittedArchitectureReview,
      operateNavUnlockPhase,
    ),
    isGovernanceModeEnabled,
  );

  const adminRows = filterNavGroupsForGovernanceMode(
    listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      shellShowExtended,
      shellShowAdvanced,
      callerAuthorityRank,
      false,
      "platform-admin",
      hasCommittedArchitectureReview,
      operateNavUnlockPhase,
    ),
    isGovernanceModeEnabled,
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
          window.dispatchEvent(new Event(ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT));
          onClose();
          onNavigate(getStartCtoDemoTourHref());
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
          onNavigate(`/reviews/${trimmed}`);
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
  const { showExtended, showAdvanced } = useNavProgressiveDisclosure();
  const { isGovernanceModeEnabled } = useGovernanceMode();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const { showExtended: shellShowExtended, showAdvanced: shellShowAdvanced } = effectiveNavDisclosureForPathname(
    pathname,
    showExtended,
    showAdvanced,
  );
  const demoUi = isStaticDemoPayloadFallbackEnabled();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const paletteExtended = buyerPolishedShell ? false : demoUi ? true : shellShowExtended;
  const paletteAdvanced = buyerPolishedShell ? false : demoUi ? true : shellShowAdvanced;
  const operatorAdvancedModeOn = showExtended && showAdvanced;
  const operateNavUnlockPhase = operateNavUnlockPhaseForAdvancedFeatures(operatorAdvancedModeOn);

  const visibleHrefs = useMemo(() => {
    const hrefs = visibleOperatorShellHrefSet(
      paletteExtended,
      paletteAdvanced,
      callerAuthorityRank,
      hasCommittedArchitectureReview,
      operateNavUnlockPhase,
    );

    if (isGovernanceModeEnabled) {
      return hrefs;
    }

    return new Set([...hrefs].filter((href) => !isGovernanceModeHiddenNavHref(href)));
  }, [
    paletteExtended,
    paletteAdvanced,
    callerAuthorityRank,
    hasCommittedArchitectureReview,
    operateNavUnlockPhase,
    isGovernanceModeEnabled,
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
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const polishedPaletteLabel = useMemo(() => buyerPolishedCommandPaletteLabel(pathname ?? ""), [pathname]);

  const polishedPalettePlaceholder = useMemo(() => {
    const path = (pathname ?? "").split("?")[0] ?? "";

    if (path.startsWith("/graph")) {
      return "Jump to audit, manifest, governance, or type another destination…";
    }

    if (path.startsWith("/ask")) {
      return "Jump to executive summary, manifest, evidence trail, or governance…";
    }

    if (path.startsWith("/compare")) {
      return "Jump to review package, signed review record, or evidence trail…";
    }

    if (path.startsWith("/audit")) {
      return "Jump to executive summary, evidence graph, manifest — or type a destination…";
    }

    if (path.startsWith("/governance")) {
      return "Jump to audit trail, findings, executive summary…";
    }

    if (path.startsWith("/dashboard")) {
      return "Jump to signed review record, evidence graph, audit…";
    }

    if (path.startsWith("/manifests")) {
      return "Jump to executive summary, graph, governance…";
    }

    return "Find another page in this review package…";
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
              ? "h-8 gap-1.5 border-neutral-300 bg-white px-2.5 text-xs font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
              : "h-8 gap-1.5 border-dashed border-neutral-400 bg-neutral-50/90 px-2.5 font-mono text-xs font-semibold tracking-tight text-neutral-800 shadow-sm hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900/80 dark:text-neutral-100 dark:hover:bg-neutral-800"
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
          <CommandPaletteDocumentationSearch buyerPolishedShell={buyerPolishedShell} onNavigate={navigate} />
          <CommandPaletteActions onNavigate={navigate} />
          <CommandPaletteDemoActions onNavigate={navigate} onClose={() => setOpen(false)} />
          <CommandPaletteCuratedTasks
            visibleHrefs={visibleHrefs}
            buyerPolishedShell={buyerPolishedShell}
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
            operateNavUnlockPhase={operateNavUnlockPhase}
            isGovernanceModeEnabled={isGovernanceModeEnabled}
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
                    <span className="ml-1 text-xs text-neutral-500">({entry.key})</span>
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
