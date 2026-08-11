"use client";

import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildSsoActivateConsequencePreview } from "@/lib/sso-activate-consequence-preview";
import { cn } from "@/lib/utils";

export type SsoActivateConsequencePreviewProps = {
  readonly className?: string;
};

/**
 * SSO wizard activate-step consequence preview (TB-2241).
 * Buyer nouns for who signs in next, what stays draft, and rollback / bypass.
 */
export function SsoActivateConsequencePreview(props: SsoActivateConsequencePreviewProps): ReactElement {
  const preview = buildSsoActivateConsequencePreview();

  return (
    <aside
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900",
        props.className,
      )}
      data-testid="sso-activate-consequence-preview"
      aria-labelledby="sso-activate-consequence-preview-title"
    >
      <h3
        id="sso-activate-consequence-preview-title"
        className={cn(
          "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
          OPERATOR_TYPOGRAPHY.cardTitle,
        )}
      >
        {preview.title}
      </h3>
      <p
        className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="sso-activate-consequence-preview-summary"
      >
        {preview.summary}
      </p>
      <dl className="m-0 mt-3 grid gap-2">
        {preview.rows.map((row) => (
          <div key={row.id} data-testid={`sso-activate-consequence-preview-${row.id}`}>
            <dt className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {row.label}
            </dt>
            <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{row.detail}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
