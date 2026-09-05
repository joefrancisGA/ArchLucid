"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ALERTS_PAGE_SHORTCUTS,
  FINDINGS_PAGE_SHORTCUTS,
  REVIEW_DETAIL_PAGE_SHORTCUTS,
  SHELL_COMMAND_SHORTCUTS,
  SHORTCUTS,
  resolveShortcutDescription,
  type ShortcutEntry,
} from "@/lib/shortcut-registry";
import {
  keyboardShortcutsSectionHrefFromSearch,
  parseKeyboardShortcutsSectionFromSearch,
  type KeyboardShortcutsSectionId,
} from "@/lib/operator/keyboard-shortcuts-section-url";

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
          <kbd className={cn("rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-mono text-neutral-800 shadow-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}>
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
      <h4 className={cn("font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{caption}</h4>
      <div
        className={cn("grid gap-2 rounded-md border border-neutral-200/80 bg-white p-3 dark:border-neutral-600 dark:bg-neutral-900/30", OPERATOR_TYPOGRAPHY.body)}
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
            <div className={cn("text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)} role="cell">
              {entry.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function partitionNavigationShortcuts(workingMode: boolean) {
  const withRoute: ShortcutEntry[] = [];

  for (const entry of SHORTCUTS) {
    if (entry.route === undefined || entry.route === "") {
      continue;
    }

    withRoute.push({
      ...entry,
      description: resolveShortcutDescription(entry, workingMode),
    });
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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const shortcutsSectionParam = searchParams.get("shortcutsSection");
  const { isWorkingMode } = useWorkspaceMode();
  const { common, rest, helpOnly } = useMemo(
    () => partitionNavigationShortcuts(isWorkingMode),
    [isWorkingMode],
  );
  const urlSection = parseKeyboardShortcutsSectionFromSearch(shortcutsSectionParam);
  const [moreOpen, setMoreOpenState] = useState(urlSection === "more");
  const [alertsOpen, setAlertsOpenState] = useState(urlSection === "alerts");
  const [findingsOpen, setFindingsOpenState] = useState(urlSection === "findings");
  const [reviewDetailOpen, setReviewDetailOpenState] = useState(urlSection === "review");
  const [helpOpen, setHelpOpenState] = useState(urlSection === "help");

  const syncSectionToUrl = useCallback(
    (sectionId: KeyboardShortcutsSectionId | null) => {
      router.replace(
        keyboardShortcutsSectionHrefFromSearch(searchParams.toString(), sectionId, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setSectionOpen = useCallback(
    (sectionId: KeyboardShortcutsSectionId, open: boolean) => {
      setMoreOpenState(sectionId === "more" && open);
      setAlertsOpenState(sectionId === "alerts" && open);
      setFindingsOpenState(sectionId === "findings" && open);
      setReviewDetailOpenState(sectionId === "review" && open);
      setHelpOpenState(sectionId === "help" && open);
      syncSectionToUrl(open ? sectionId : null);
    },
    [syncSectionToUrl],
  );

  useEffect(() => {
    const section = parseKeyboardShortcutsSectionFromSearch(shortcutsSectionParam);
    setMoreOpenState(section === "more");
    setAlertsOpenState(section === "alerts");
    setFindingsOpenState(section === "findings");
    setReviewDetailOpenState(section === "review");
    setHelpOpenState(section === "help");
  }, [shortcutsSectionParam]);

  const workingDeskWorkShortcuts = useMemo(
    () => [...FINDINGS_PAGE_SHORTCUTS, ...REVIEW_DETAIL_PAGE_SHORTCUTS],
    [],
  );

  return (
    <div className="space-y-4">
      {/* Uncollapsed and first: the palette reaches every page, so it is the shortcut worth learning. */}
      <ShortcutTable entries={SHELL_COMMAND_SHORTCUTS} caption="Command palette" />
      {isWorkingMode ? (
        <ShortcutTable entries={workingDeskWorkShortcuts} caption="Desk work (Working)" />
      ) : null}
      <ShortcutTable entries={common} caption="Common" />
      {rest.length > 0 ? (
        <Collapsible open={moreOpen} onOpenChange={(open) => setSectionOpen("more", open)}>
          <CollapsibleTrigger
            type="button"
            className={cn("w-full rounded-md border border-dashed border-neutral-200 py-1.5 text-left font-semibold text-al-text-primary hover:bg-[var(--al-layer-hover)] dark:border-neutral-600", OPERATOR_TYPOGRAPHY.helper)}
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
        <Collapsible open={alertsOpen} onOpenChange={(open) => setSectionOpen("alerts", open)}>
          <CollapsibleTrigger
            type="button"
            className={cn("w-full rounded-md border border-dashed border-neutral-200 py-1.5 text-left font-semibold text-al-text-primary hover:bg-[var(--al-layer-hover)] dark:border-neutral-600", OPERATOR_TYPOGRAPHY.helper)}
            aria-expanded={alertsOpen}
          >
            {alertsOpen ? "Hide" : "Show"} alerts page shortcuts
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ShortcutTable entries={ALERTS_PAGE_SHORTCUTS} caption="Alerts page" />
          </CollapsibleContent>
        </Collapsible>
      ) : null}
      {FINDINGS_PAGE_SHORTCUTS.length > 0 ? (
        <Collapsible open={findingsOpen} onOpenChange={(open) => setSectionOpen("findings", open)}>
          <CollapsibleTrigger
            type="button"
            className={cn("w-full rounded-md border border-dashed border-neutral-200 py-1.5 text-left font-semibold text-al-text-primary hover:bg-[var(--al-layer-hover)] dark:border-neutral-600", OPERATOR_TYPOGRAPHY.helper)}
            aria-expanded={findingsOpen}
          >
            {findingsOpen ? "Hide" : "Show"} findings page shortcuts
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ShortcutTable entries={FINDINGS_PAGE_SHORTCUTS} caption="Findings page" />
          </CollapsibleContent>
        </Collapsible>
      ) : null}
      {REVIEW_DETAIL_PAGE_SHORTCUTS.length > 0 ? (
        <Collapsible open={reviewDetailOpen} onOpenChange={(open) => setSectionOpen("review", open)}>
          <CollapsibleTrigger
            type="button"
            className={cn("w-full rounded-md border border-dashed border-neutral-200 py-1.5 text-left font-semibold text-al-text-primary hover:bg-[var(--al-layer-hover)] dark:border-neutral-600", OPERATOR_TYPOGRAPHY.helper)}
            aria-expanded={reviewDetailOpen}
          >
            {reviewDetailOpen ? "Hide" : "Show"} review page shortcuts
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ShortcutTable entries={REVIEW_DETAIL_PAGE_SHORTCUTS} caption="Review page" />
          </CollapsibleContent>
        </Collapsible>
      ) : null}
      {helpOnly.length > 0 ? (
        <Collapsible open={helpOpen} onOpenChange={(open) => setSectionOpen("help", open)}>
          <CollapsibleTrigger
            type="button"
            className={cn("w-full rounded-md border border-dashed border-neutral-200 py-1.5 text-left font-semibold text-al-text-primary hover:bg-[var(--al-layer-hover)] dark:border-neutral-600", OPERATOR_TYPOGRAPHY.helper)}
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
