"use client";

import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildFinalizeConsequencePreview } from "@/lib/finalize-consequence-preview";
import { cn } from "@/lib/utils";

export type FinalizeConsequencePreviewProps = {
  readonly className?: string;
};

/**
 * Finalize confirm-dialog consequence preview (TB-2224).
 * Buyer nouns for what locks, stays editable, and which exports unlock.
 */
export function FinalizeConsequencePreview(props: FinalizeConsequencePreviewProps): ReactElement {
  const preview = buildFinalizeConsequencePreview();

  return (
    <aside
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900",
        props.className,
      )}
      data-testid="finalize-consequence-preview"
      aria-labelledby="finalize-consequence-preview-title"
    >
      <h3
        id="finalize-consequence-preview-title"
        className={cn(
          "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
          OPERATOR_TYPOGRAPHY.cardTitle,
        )}
      >
        {preview.title}
      </h3>
      <p
        className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="finalize-consequence-preview-summary"
      >
        {preview.summary}
      </p>
      <dl className="m-0 mt-3 grid gap-2">
        {preview.rows.map((row) => (
          <div key={row.id} data-testid={`finalize-consequence-preview-${row.id}`}>
            <dt className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {row.label}
            </dt>
            <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{row.detail}</dd>
          </div>
        ))}
      </dl>
      <p
        className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="finalize-consequence-preview-replay"
      >
        {preview.replayNote}
      </p>
    </aside>
  );
}
