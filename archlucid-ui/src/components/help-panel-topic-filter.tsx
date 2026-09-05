"use client";

import type React from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { matchesShortcutQuery } from "@/components/KeyboardShortcutsHelpContent";
import {
  ALERTS_PAGE_SHORTCUTS,
  FINDINGS_PAGE_SHORTCUTS,
  REVIEW_DETAIL_PAGE_SHORTCUTS,
  SHELL_COMMAND_SHORTCUTS,
  SHORTCUTS,
} from "@/lib/shortcut-registry";
import {
  helpTopicsForGuidesTab,
  helpTopicsForTroubleshootingTab,
  type HelpTopic,
} from "@/lib/help/help-topics";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export const KEY_CONCEPTS: { label: string; text: string }[] = [
  { label: "Request", text: "The architecture intent you submit." },
  { label: "Architecture review", text: "The packaged review created from a request (context, graph, findings, finalized review record)." },
  { label: SIGNED_MANIFEST_LABEL, text: "The finalized architecture output produced when a review is finalized." },
  { label: "Artifacts", text: "Supporting files, findings, and review materials." },
];

/** Every row the Shortcuts tab can render, so a query never hides a shortcut the tab would show. */
export function allShortcutRowsForSearch(): { key: string; description: string }[] {
  return [...SHELL_COMMAND_SHORTCUTS, ...SHORTCUTS, ...ALERTS_PAGE_SHORTCUTS, ...FINDINGS_PAGE_SHORTCUTS, ...REVIEW_DETAIL_PAGE_SHORTCUTS].map(
    (entry) => ({ key: entry.key, description: entry.description }),
  );
}

export function topicMatchesQuery(topic: HelpTopic, query: string): boolean {
  const q = query.trim().toLowerCase();

  if (q.length === 0) {
    return true;
  }

  return (
    topic.title.toLowerCase().includes(q) ||
    topic.summary.toLowerCase().includes(q) ||
    topic.keywords.some((k) => k.toLowerCase().includes(q))
  );
}

export function filterGuidesForPath(
  guidesBase: readonly HelpTopic[],
  pathname: string,
  query: string,
): HelpTopic[] {
  const q = query.trim();

  if (q.length === 0) {
    const byRoute = guidesBase.filter((topic) =>
      topic.routes.some((route) => pathname === route || pathname.startsWith(`${route}/`)),
    );

    return byRoute.length > 0 ? byRoute : [...guidesBase];
  }

  return guidesBase.filter((topic) => topicMatchesQuery(topic, q));
}

export function filterTroubleshootingTopics(
  troubleshootingBase: readonly HelpTopic[],
  query: string,
): HelpTopic[] {
  if (query.trim().length === 0) {
    return [...troubleshootingBase];
  }

  return troubleshootingBase.filter((topic) => topicMatchesQuery(topic, query));
}

export function filterShortcutRowsForQuery(
  allShortcutRows: readonly { key: string; description: string }[],
  query: string,
): { key: string; description: string }[] {
  const q = query.trim();

  if (q.length === 0) {
    return [...allShortcutRows];
  }

  return allShortcutRows.filter((row) => matchesShortcutQuery(q, row.description, row.key));
}

export type HelpGuideTopicLinkRowProps = {
  readonly topic: HelpTopic;
  readonly href: string;
  readonly onNavigate: () => void;
};

export function HelpGuideTopicLinkRow({ topic, href, onNavigate }: HelpGuideTopicLinkRowProps): React.JSX.Element {
  return (
    <li className="list-none">
      <Link
        href={href}
        title={topic.docPath.length > 0 ? topic.docPath : href}
        className={cn(
          "flex w-full items-start gap-3 rounded-md border border-neutral-200/90 bg-white p-3 text-left shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900/50 dark:hover:border-neutral-500 dark:hover:bg-neutral-900",
          OPERATOR_LINK.nav,
        )}
        onClick={onNavigate}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-neutral-900 dark:text-neutral-100">{topic.title}</span>
          <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {topic.summary}
          </span>
        </span>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden />
      </Link>
    </li>
  );
}

export { helpTopicsForGuidesTab, helpTopicsForTroubleshootingTab };
