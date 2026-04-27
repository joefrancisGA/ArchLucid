"use client";

import { useCommandState } from "cmdk";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { useNavProgressiveDisclosure } from "@/hooks/useNavProgressiveDisclosure";
import { NAV_GROUPS } from "@/lib/nav-config";
import { effectiveNavDisclosureForPathname } from "@/lib/nav-disclosure-for-path";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { SHORTCUTS } from "@/lib/shortcut-registry";

const RUN_ID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function RunIdQuickOpen({ onNavigate }: { onNavigate: (href: string) => void }) {
  const search = useCommandState((state) => state.search);
  const trimmed = search.trim();

  if (!RUN_ID_LIKE.test(trimmed)) {
    return null;
  }

  return (
    <CommandGroup heading="Quick open">
      <CommandItem
        value={`open-run-${trimmed}`}
        onSelect={() => {
          onNavigate(`/runs/${trimmed}`);
        }}
      >
        Open run detail for {trimmed}
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
  const { showExtended: shellShowExtended, showAdvanced: shellShowAdvanced } = effectiveNavDisclosureForPathname(
    pathname,
    showExtended,
    showAdvanced,
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

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1 text-xs font-semibold"
        aria-label="Open command palette"
        onClick={() => {
          setOpen(true);
        }}
      >
        Jump…
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages or paste a run id…" />
        <CommandList>
          <RunIdQuickOpen onNavigate={navigate} />
          <CommandEmpty>No matching pages. Try another search or paste a run UUID.</CommandEmpty>
          {listNavGroupsVisibleInOperatorShell(
            NAV_GROUPS,
            shellShowExtended,
            shellShowAdvanced,
            callerAuthorityRank,
          ).map(({ group, visibleLinks }) => (
            <CommandGroup key={group.id} heading={group.label}>
              {visibleLinks.map((link) => (
                <CommandItem
                  key={link.href}
                  value={`${link.label} ${link.href}`}
                  onSelect={() => {
                    navigate(link.href);
                  }}
                >
                  {link.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
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
        </CommandList>
      </CommandDialog>
    </>
  );
}
