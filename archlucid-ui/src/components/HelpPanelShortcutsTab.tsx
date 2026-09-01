"use client";

import { cn } from "@/lib/utils";

import { KeyboardShortcutsTabContent } from "@/components/KeyboardShortcutsHelpContent";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type HelpPanelShortcutsTabProps = {
  readonly query: string;
  readonly shortcutsSearchHits: readonly { key: string; description: string }[];
};

export function HelpPanelShortcutsTab({ query, shortcutsSearchHits }: HelpPanelShortcutsTabProps) {
  if (query.trim().length > 0 && shortcutsSearchHits.length === 0) {
    return (
      <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>No shortcuts match your search.</p>
    );
  }

  if (query.trim().length > 0) {
    return (
      <div>
        <h3 className={cn("mb-2 font-semibold text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>
          Search results
        </h3>
        <div className="space-y-2 rounded-md border border-neutral-200/80 p-2 dark:border-neutral-600">
          {shortcutsSearchHits.map((row) => (
            <div key={row.key} className={cn("text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              <kbd className={cn(
                "mr-2 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono dark:border-neutral-600 dark:bg-neutral-800",
                OPERATOR_TYPOGRAPHY.micro,
              )}>
                {row.key}
              </kbd>
              {row.description}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <KeyboardShortcutsTabContent />;
}
