"use client";

import { Fragment, useMemo, useState } from "react";
import type React from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ALERTS_PAGE_SHORTCUTS, SHORTCUTS, type ShortcutEntry } from "@/lib/shortcut-registry";

const COMMON_NAV_KEYS = new Set(["alt+n", "alt+r", "alt+a", "alt+h"]);

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
          <kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-mono text-xs text-neutral-800 shadow-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100">
            {formatKeyPart(part)}
          </kbd>
        </Fragment>
      ))}
    </span>
  );
}

function ShortcutTable({
  entries,
  caption,
}: {
  entries: ReadonlyArray<{ key: string; description: string }>;
  caption: string;
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{caption}</h4>
      <div
        className="grid gap-2 rounded-md border border-neutral-200/80 bg-white p-3 text-sm dark:border-neutral-600 dark:bg-neutral-900/30"
        role="table"
        aria-label={caption}
      >
        {entries.map((entry) => (
          <div
            key={entry.key}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-start gap-3 border-b border-neutral-200/60 pb-2 last:border-b-0 last:pb-0 dark:border-neutral-600/60"
            role="row"
          >
            <div className="font-medium text-neutral-800 dark:text-neutral-100" role="cell">
              <ShortcutComboKbd combo={entry.key} />
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-300" role="cell">
              {entry.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function partitionNavigationShortcuts() {
  const withRoute: ShortcutEntry[] = [];

  for (const entry of SHORTCUTS) {
    if (entry.route === undefined || entry.route === "") {
      continue;
    }

    withRoute.push(entry);
  }

  const common = withRoute.filter((e) => COMMON_NAV_KEYS.has(e.key.toLowerCase()));
  const rest = withRoute.filter((e) => !COMMON_NAV_KEYS.has(e.key.toLowerCase()));

  const helpOnly = SHORTCUTS.filter((e) => e.route === undefined || e.route === "");

  return { common, rest, helpOnly };
}

/**
 * Shortcuts for the Help surface: common first; advanced in collapsible sections.
 * Also used from tests to keep shortcut copy aligned.
 */
export function KeyboardShortcutsTabContent(): React.ReactElement {
  const { common, rest, helpOnly } = useMemo(() => partitionNavigationShortcuts(), []);
  const [moreOpen, setMoreOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="space-y-4">
      <ShortcutTable entries={common} caption="Common" />
      {rest.length > 0 ? (
        <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
          <CollapsibleTrigger
            type="button"
            className="w-full rounded-md border border-dashed border-neutral-200 py-1.5 text-left text-xs font-semibold text-teal-800 hover:bg-teal-50 dark:border-neutral-600 dark:text-teal-200 dark:hover:bg-teal-950/30"
            aria-expanded={moreOpen}
          >
            {moreOpen ? "Hide" : "Show"} all navigation shortcuts
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ShortcutTable entries={rest} caption="All navigation" />
          </CollapsibleContent>
        </Collapsible>
      ) : null}
      {ALERTS_PAGE_SHORTCUTS.length > 0 ? (
        <Collapsible open={alertsOpen} onOpenChange={setAlertsOpen}>
          <CollapsibleTrigger
            type="button"
            className="w-full rounded-md border border-dashed border-neutral-200 py-1.5 text-left text-xs font-semibold text-teal-800 hover:bg-teal-50 dark:border-neutral-600 dark:text-teal-200 dark:hover:bg-teal-950/30"
            aria-expanded={alertsOpen}
          >
            {alertsOpen ? "Hide" : "Show"} alerts page shortcuts
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ShortcutTable entries={ALERTS_PAGE_SHORTCUTS} caption="Alerts page" />
          </CollapsibleContent>
        </Collapsible>
      ) : null}
      {helpOnly.length > 0 ? (
        <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
          <CollapsibleTrigger
            type="button"
            className="w-full rounded-md border border-dashed border-neutral-200 py-1.5 text-left text-xs font-semibold text-teal-800 hover:bg-teal-50 dark:border-neutral-600 dark:text-teal-200 dark:hover:bg-teal-950/30"
            aria-expanded={helpOpen}
          >
            {helpOpen ? "Hide" : "Show"} help overlay shortcut
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ShortcutTable entries={helpOnly} caption="Help" />
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}

/** @deprecated Use KeyboardShortcutsTabContent — kept for any external imports expecting the old name. */
export const KeyboardShortcutsHelpContent = KeyboardShortcutsTabContent;

export function matchesShortcutQuery(query: string, description: string, key: string): boolean {
  const q = query.trim().toLowerCase();

  if (q.length === 0) {
    return true;
  }

  return description.toLowerCase().includes(q) || key.toLowerCase().includes(q) || key.replace(/\+/g, " ").includes(q);
}
