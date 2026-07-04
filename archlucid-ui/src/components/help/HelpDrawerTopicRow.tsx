"use client";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

import type { HelpSearchPanelTopic } from "@/lib/help-search-panel-catalog";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type HelpDrawerTopicRowProps = {
  readonly topic: HelpSearchPanelTopic;
  readonly isHighlighted: boolean;
  readonly onActivate: (topic: HelpSearchPanelTopic) => void;
  readonly onHighlight: () => void;
};

/** Full-width help drawer action row — always a real button with chevron affordance. */
export function HelpDrawerTopicRow({
  topic,
  isHighlighted,
  onActivate,
  onHighlight,
}: HelpDrawerTopicRowProps): React.JSX.Element {
  const accessibleLabel = `${topic.title}. ${topic.description}`;

  return (
    <li className="list-none">
      <button
        type="button"
        data-help-drawer-row=""
        aria-label={accessibleLabel}
        className={cn(
          "flex w-full cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-left transition-colors",
          isHighlighted
            ? "border-neutral-300 bg-[var(--al-layer-hover)] dark:border-neutral-600 dark:bg-neutral-800/80"
            : "border-transparent hover:border-neutral-200 hover:bg-neutral-50 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/60",
        )}
        onClick={() => {
          onActivate(topic);
        }}
        onFocus={onHighlight}
        onMouseEnter={onHighlight}
      >
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block font-semibold text-neutral-900 dark:text-neutral-100",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            {topic.title}
          </span>
          <span
            className={cn(
              "mt-1 block leading-snug text-neutral-600 dark:text-neutral-400",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            {topic.description}
          </span>
        </span>
        <ChevronRight
          className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500"
          aria-hidden
        />
      </button>
    </li>
  );
}
