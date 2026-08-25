"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type PageShortcutEntry = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
};

export type PageShortcutsDisclosureProps = {
  readonly testId: string;
  readonly entries: readonly PageShortcutEntry[];
};

/** Compact page-scoped shortcut legend — not a global coach banner. */
export function PageShortcutsDisclosure(props: PageShortcutsDisclosureProps): React.JSX.Element {
  return (
    <details
      className={cn("rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.helper)}
      data-testid={props.testId}
    >
      <summary className="cursor-pointer font-medium text-al-text-primary">Shortcuts</summary>
      <ul className="m-0 mt-2 list-none space-y-2 p-0">
        {props.entries.map((entry) => (
          <li key={entry.id} data-testid={`${props.testId}-entry-${entry.id}`}>
            <span className="font-medium text-al-text-primary">{entry.label}</span>
            <span className="text-al-text-secondary"> — {entry.description}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
