"use client";

import { useCommandState } from "cmdk";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useNavProgressiveDisclosure } from "@/hooks/useNavProgressiveDisclosure";
import { BUYER_COMMAND_PALETTE_CURATED_TASKS } from "@/lib/command-palette-buyer-curated-tasks";
import { COMMAND_PALETTE_CURATED_TASKS } from "@/lib/command-palette-curated-tasks";
import { DOCUMENTATION_SEARCH_ITEMS, documentationSearchOpenUrl } from "@/lib/docs-search-index";
import { NAV_GROUPS } from "@/lib/nav-config";
import { effectiveNavDisclosureForPathname } from "@/lib/nav-disclosure-for-path";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { listNavGroupsVisibleInOperatorShell, visibleOperatorShellHrefSet } from "@/lib/nav-shell-visibility";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { OPEN_COMMAND_PALETTE_EVENT, SHORTCUTS } from "@/lib/shortcut-registry";

const RUN_ID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Buyer-polished header search: route-aware label for ⌘K control (accessible name matches visible chip). */
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

function CommandPaletteDocumentationSearch({ buyerPolishedShell }: { buyerPolishedShell: boolean }) {
  return (
    <CommandGroup heading={buyerPolishedShell ? "Help topics" : "Documentation"}>
      {DOCUMENTATION_SEARCH_ITEMS.map((row) => (
        <CommandItem
          key={row.relativeDocsPath}
          value={`doc ${row.title} ${row.description} ${row.category} ${row.relativeDocsPath}`}
          onSelect={() => {
            documentationSearchOpenUrl(row.relativeDocsPath);
          }}
        >
          <span className="font-medium">{row.title}</span>
          <span className="ml-2 text-xs text-neutral-500">{row.category}</span>
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
  onNavigate,
}: {
  callerAuthorityRank: number;
  shellShowExtended: boolean;
  shellShowAdvanced: boolean;
  hasCommittedArchitectureReview: boolean;
  buyerPolishedShell: boolean;
  onNavigate: (href: string) => void;
}) {
  const search = useCommandState((state) => state.search);
  const showAdminPalette = search.trim().length > 0;

  const reviewRows = listNavGroupsVisibleInOperatorShell(
    NAV_GROUPS,
    shellShowExtended,
    shellShowAdvanced,
    callerAuthorityRank,
    false,
    "review-workflow",
    hasCommittedArchitectureReview,
  );

  const adminRows = listNavGroupsVisibleInOperatorShell(
    NAV_GROUPS,
    shellShowExtended,
    shellShowAdvanced,
    callerAuthorityRank,
    false,
    "platform-admin",
    hasCommittedArchitectureReview,
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
 * Ctrl+K / ⌘K command palette: jump to operator pages surfaced in nav config.
 * Uses **`listNavGroupsVisibleInOperatorShell`** (tier → authority, omit empty groups) — same as sidebar and mobile drawer.
 * Optional run UUID quick-open is unchanged.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { showExtended, showAdvanced } = useNavProgressiveDisclosure();
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

  const visibleHrefs = useMemo(
    () =>
      visibleOperatorShellHrefSet(
        paletteExtended,
        paletteAdvanced,
        callerAuthorityRank,
        hasCommittedArchitectureReview,
      ),
    [
      paletteExtended,
      paletteAdvanced,
      callerAuthorityRank,
      hasCommittedArchitectureReview,
    ],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

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
      return "Jump to review package, signed manifest, or evidence trail…";
    }

    if (path.startsWith("/audit")) {
      return "Jump to executive summary, evidence graph, manifest — or type a destination…";
    }

    if (path.startsWith("/governance")) {
      return "Jump to audit trail, findings, executive summary…";
    }

    if (path.startsWith("/dashboard")) {
      return "Jump to signed manifest, evidence graph, audit…";
    }

    if (path.startsWith("/manifests")) {
      return "Jump to executive summary, graph, governance…";
    }

    return "Find another page in this review package…";
  }, [pathname]);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={
              buyerPolishedShell
                ? "h-8 gap-1.5 border-neutral-300 bg-white px-2.5 text-xs font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                : "h-8 gap-1.5 border-dashed border-neutral-400 bg-neutral-50/90 px-2.5 font-mono text-xs font-semibold tracking-tight text-neutral-800 shadow-sm hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900/80 dark:text-neutral-100 dark:hover:bg-neutral-800"
            }
            aria-label={buyerPolishedShell ? polishedPaletteLabel : "Open command palette"}
            onClick={() => {
              setOpen(true);
            }}
          >
            {buyerPolishedShell ? null : (
              <span className="rounded border border-neutral-300 bg-white px-1 py-0.5 text-[10px] font-semibold text-neutral-600 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-400">
                ⌘K
              </span>
            )}
            <span>{buyerPolishedShell ? polishedPaletteLabel : "Search"}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>
          {buyerPolishedShell
            ? `${polishedPaletteLabel} — ⌘K to jump destinations and documentation.`
            : "Search pages or open a workflow with the keyboard shortcut."}
        </TooltipContent>
      </Tooltip>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={buyerPolishedShell ? polishedPalettePlaceholder : "Search pages or paste a review ID…"} />
        <CommandList>
          <RunIdQuickOpen onNavigate={navigate} allowRunIdPaste={!buyerPolishedShell} />
          <CommandPaletteDocumentationSearch buyerPolishedShell={buyerPolishedShell} />
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
