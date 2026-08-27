"use client";

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

import { helpDrawerRowButtonClass } from "@/components/help/help-drawer-row-class";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  HELP_SEARCH_PANEL_DO_THIS_NOW_HEADING,
  type HelpSearchPanelTopic,
} from "@/lib/help/help-search-panel-catalog";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type HelpDrawerDoThisNowRowProps = {
  readonly topic: HelpSearchPanelTopic;
  readonly isHighlighted: boolean;
  readonly onActivate: (topic: HelpSearchPanelTopic) => void;
  readonly onHighlight: () => void;
};

/** Primary next-step row for the Help drawer — one action above Recommended (TB-1045). */
export function HelpDrawerDoThisNowRow({
  topic,
  isHighlighted,
  onActivate,
  onHighlight,
}: HelpDrawerDoThisNowRowProps): React.JSX.Element {
  const accessibleLabel = `${HELP_SEARCH_PANEL_DO_THIS_NOW_HEADING}. ${topic.title}. ${topic.description}`;

  return (
    <section
      aria-labelledby="help-search-do-this-now-heading"
      data-testid="help-search-do-this-now"
    >
      <h3
        id="help-search-do-this-now-heading"
        className={cn(
          "m-0 px-3 py-2 text-xs font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-200",
        )}
      >
        {HELP_SEARCH_PANEL_DO_THIS_NOW_HEADING}
      </h3>
      <ul className="m-0 p-0">
        <li className="list-none">
          <button
            type="button"
            data-help-drawer-row=""
            data-testid="help-search-do-this-now-primary"
            aria-label={accessibleLabel}
            className={cn(
              "group",
              helpDrawerRowButtonClass(isHighlighted),
              // The only elevated row in the drawer, so primacy is not carried by tint alone.
              cn(HELP_PAGE_LAYOUT.contentPanel, "p-3 shadow-sm"),
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
            <ArrowRight
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--al-accent-interactive)] opacity-90"
              aria-hidden
            />
          </button>
        </li>
      </ul>
    </section>
  );
}
