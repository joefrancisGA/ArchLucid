import { cn } from "@/lib/utils";
import Link from "next/link";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { DigestSetupChecklistItem } from "@/lib/digest-setup-gap-actions";
import { DIGESTS_BROWSE_CHECKLIST_TITLE } from "@/lib/digests-browse-copy";

type DigestsBrowseSetupChecklistProps = {
  readonly items: readonly DigestSetupChecklistItem[];
};

/** Compact setup checklist for the Browse tab empty and pre-history states. */
export function DigestsBrowseSetupChecklist(props: DigestsBrowseSetupChecklistProps): React.JSX.Element {
  return (
    <section
      aria-labelledby="digests-browse-checklist-heading"
      className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="digests-browse-setup-checklist"
    >
      <h3 id="digests-browse-checklist-heading" className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {DIGESTS_BROWSE_CHECKLIST_TITLE}
      </h3>
      <ul className="m-0 mt-3 list-none space-y-2 p-0">
        {props.items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
          >
            <div className="min-w-0 flex-1">
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                <span aria-hidden>{item.complete ? "✓ " : "○ "}</span>
                {item.label}
              </p>
              <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{item.detail}</p>
            </div>
            {item.complete ? (
              <span className={cn("text-emerald-700 dark:text-emerald-300", OPERATOR_TYPOGRAPHY.helper)}>Complete</span>
            ) : (
              <Link href={item.href} className={cn("font-medium text-al-link underline-offset-2 hover:underline", OPERATOR_TYPOGRAPHY.helper)}>
                Continue
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
