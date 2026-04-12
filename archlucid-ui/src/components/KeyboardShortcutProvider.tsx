"use client";

import type { ReactNode } from "react";
import { Fragment, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useShortcutNavigation } from "@/hooks/useShortcutNavigation";
import { ALERTS_PAGE_SHORTCUTS, SHORTCUTS, type ShortcutEntry } from "@/lib/shortcut-registry";

function formatKeyPart(part: string): string {
  const trimmed = part.trim().toLowerCase();

  if (trimmed === "?") {
    return "?";
  }

  if (trimmed.length === 1) {
    return trimmed.toUpperCase();
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function ShortcutComboKbd({ combo }: { combo: string }) {
  const parts = combo.split("+").map((segment) => segment.trim());

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {parts.map((part, index) => (
        <Fragment key={`${part}-${index}`}>
          {index > 0 ? <span className="text-neutral-400 dark:text-neutral-500">+</span> : null}
          <kbd>{formatKeyPart(part)}</kbd>
        </Fragment>
      ))}
    </span>
  );
}

function ShortcutTable({
  entries,
  caption,
}: {
  entries: ReadonlyArray<Pick<ShortcutEntry, "key" | "description">>;
  caption: string;
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {caption}
      </h3>
      <div
        className="grid gap-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900/50"
        role="table"
        aria-label={caption}
      >
        {entries.map((entry) => (
          <div
            key={entry.key}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-start gap-3 border-b border-neutral-200/80 pb-2 last:border-b-0 last:pb-0 dark:border-neutral-700/80"
            role="row"
          >
            <div className="font-medium text-neutral-800 dark:text-neutral-100" role="cell">
              <ShortcutComboKbd combo={entry.key} />
            </div>
            <div className="text-neutral-600 dark:text-neutral-300" role="cell">
              {entry.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export type KeyboardShortcutProviderProps = {
  children: ReactNode;
};

/**
 * Global keyboard shortcuts + Shift+? help dialog. Renders children unchanged; attaches listeners via
 * `useShortcutNavigation` (must run under a client boundary because the root layout is an RSC).
 */
export function KeyboardShortcutProvider({ children }: KeyboardShortcutProviderProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  useShortcutNavigation({
    onHelpRequested: () => {
      setHelpOpen(true);
    },
  });

  const { navigationEntries, helpEntries } = useMemo(() => {
    const navigation: ShortcutEntry[] = [];
    const help: ShortcutEntry[] = [];

    for (const entry of SHORTCUTS) {
      if (entry.route !== undefined && entry.route !== "") {
        navigation.push(entry);
      } else {
        help.push(entry);
      }
    }

    return { navigationEntries: navigation, helpEntries: help };
  }, []);

  return (
    <>
      {children}

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
            <DialogDescription>
              Press Alt + key to navigate. Works anywhere except inside text inputs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            <ShortcutTable entries={navigationEntries} caption="Navigation" />
            <ShortcutTable entries={ALERTS_PAGE_SHORTCUTS} caption="Alerts page" />
            <ShortcutTable entries={helpEntries} caption="Help" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
