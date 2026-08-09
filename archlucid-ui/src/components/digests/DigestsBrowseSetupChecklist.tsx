import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { DigestSetupChecklistItem } from "@/lib/digest-setup-gap-actions";
import {
  DIGESTS_BROWSE_CHECKLIST_LEAD,
  DIGESTS_BROWSE_CHECKLIST_TITLE,
} from "@/lib/digests-browse-copy";

type DigestsBrowseSetupChecklistProps = {
  readonly items: readonly DigestSetupChecklistItem[];
};

/**
 * The single guided story for the Browse tab when digests are not yet flowing (TB-1480).
 * Owns step status, so the health banner must not repeat gaps or a next-best action here.
 */
export function DigestsBrowseSetupChecklist(props: DigestsBrowseSetupChecklistProps): ReactElement {
  const completedCount: number = props.items.filter((item) => item.complete).length;
  const firstIncompleteActionableId: string | undefined = props.items.find(
    (item) => item.href !== null && !item.complete,
  )?.id;

  return (
    <section
      aria-labelledby="digests-browse-checklist-heading"
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="digests-browse-setup-checklist"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3
          id="digests-browse-checklist-heading"
          className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {DIGESTS_BROWSE_CHECKLIST_TITLE}
        </h3>
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="digests-browse-checklist-progress"
        >
          {completedCount} of {props.items.length} complete
        </span>
      </div>
      <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {DIGESTS_BROWSE_CHECKLIST_LEAD}
      </p>
      <ol className="m-0 mt-3 list-none space-y-2 p-0">
        {props.items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
            data-testid={`digests-browse-checklist-item-${item.id}`}
          >
            <div className="min-w-0 flex-1">
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {item.label}
              </p>
              <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{item.detail}</p>
            </div>
            {item.complete ? (
              <StatusTag kind="ready" label="Complete" />
            ) : item.href !== null ? (
              <Button
                asChild
                size="sm"
                variant={item.id === firstIncompleteActionableId ? "primary" : "outline"}
                data-testid={`digests-browse-checklist-action-${item.id}`}
              >
                <Link href={item.href}>{item.actionLabel}</Link>
              </Button>
            ) : (
              <StatusTag kind="draft" label="Pending" />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
