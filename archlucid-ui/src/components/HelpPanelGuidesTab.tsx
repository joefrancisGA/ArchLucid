"use client";

import { cn } from "@/lib/utils";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { getHelpTopicHref, type HelpTopic } from "@/lib/help/help-topics";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { HelpGuideTopicLinkRow, KEY_CONCEPTS } from "./help-panel-topic-filter";

export type HelpPanelGuidesTabProps = {
  readonly corePilotPinnedHelp: React.ReactNode;
  readonly guidesFiltered: readonly HelpTopic[];
  readonly onNavigate: () => void;
};

export function HelpPanelGuidesTab({
  corePilotPinnedHelp,
  guidesFiltered,
  onNavigate,
}: HelpPanelGuidesTabProps) {
  return (
    <>
      {corePilotPinnedHelp}
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800">
        <h3 className={cn("m-0 font-semibold text-al-text-primary dark:text-neutral-100", OPERATOR_NAV_GROUP_LABEL)}>
          Key concepts
        </h3>
        <ul className={cn("m-0 mt-2 list-none space-y-1.5 p-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          {KEY_CONCEPTS.map((row) => (
            <li key={row.label}>
              <InlineGuidanceLabel label={`${row.label}:`} /> {row.text}
            </li>
          ))}
        </ul>
      </div>
      <h3 className={cn("m-0 font-semibold text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>
        Topics
      </h3>
      {guidesFiltered.length === 0 ? (
        <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>No topics match your search.</p>
      ) : (
        <ul className="m-0 space-y-2 p-0">
          {guidesFiltered.map((topic) => {
            const href = getHelpTopicHref(topic);

            if (href === null) {
              return (
                <li
                  key={topic.id}
                  className="rounded-md border border-neutral-200/90 bg-white p-3 dark:border-neutral-600 dark:bg-neutral-900/50"
                >
                  <div className="font-medium text-neutral-900 dark:text-neutral-100">{topic.title}</div>
                  <p className={cn("mt-1 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{topic.summary}</p>
                </li>
              );
            }

            return (
              <HelpGuideTopicLinkRow
                key={topic.id}
                topic={topic}
                href={href}
                onNavigate={onNavigate}
              />
            );
          })}
        </ul>
      )}
    </>
  );
}
