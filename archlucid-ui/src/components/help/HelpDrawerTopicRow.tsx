"use client";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

import {
  HELP_DRAWER_CHEVRON_CLASS,
  helpDrawerRowButtonClass,
} from "@/components/help/help-drawer-row-class";
import type { HelpSearchPanelTopic } from "@/lib/help/help-search-panel-catalog";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveHelpDrawerBrowseLabel, resolveHelpTopicBrowseLabel } from "@/lib/help/help-center-browse-labels";

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
  const helpSlug = topic.action.kind === "route" ? topic.action.helpSlug : null;
  const browseLabel = resolveHelpDrawerBrowseLabel(helpSlug);
  // Screen readers still hear Guide vs Documentation even when the eyebrow is not drawn.
  const spokenBrowseLabel = resolveHelpTopicBrowseLabel(helpSlug);
  const accessibleLabel =
    spokenBrowseLabel !== null
      ? `${spokenBrowseLabel}. ${topic.title}. ${topic.description}`
      : `${topic.title}. ${topic.description}`;

  return (
    <li className="list-none">
      <button
        type="button"
        data-help-drawer-row=""
        aria-label={accessibleLabel}
        className={cn("group", helpDrawerRowButtonClass(isHighlighted))}
        onClick={() => {
          onActivate(topic);
        }}
        onFocus={onHighlight}
        onMouseEnter={onHighlight}
      >
        <span className="min-w-0 flex-1">
          {browseLabel !== null ? (
            <span
              className={cn(
                "mb-1 block font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400",
                OPERATOR_TYPOGRAPHY.micro,
              )}
              data-testid="help-drawer-browse-label"
            >
              {browseLabel}
            </span>
          ) : null}
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
        <ChevronRight className={HELP_DRAWER_CHEVRON_CLASS} aria-hidden />
      </button>
    </li>
  );
}
