"use client";

import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  getShareLinkPermissionClarityRows,
  SHARE_LINK_PERMISSION_CLARITY_INTRO,
  SHARE_LINK_PERMISSION_CLARITY_TITLE,
} from "@/lib/share-link-permission-clarity";
import { cn } from "@/lib/utils";

export type ShareLinkPermissionClarityPanelProps = {
  readonly className?: string;
};

/**
 * Create-time share-link permission matrix (TB-2212).
 * Distinct from ColdSharedLinkUnpackPanel (recipient cold open).
 */
export function ShareLinkPermissionClarityPanel(
  props: ShareLinkPermissionClarityPanelProps,
): ReactElement {
  const rows = getShareLinkPermissionClarityRows();

  return (
    <section
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900",
        props.className,
      )}
      data-testid="share-link-permission-clarity"
      aria-labelledby="share-link-permission-clarity-title"
    >
      <h3
        id="share-link-permission-clarity-title"
        className={cn(
          "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
          OPERATOR_TYPOGRAPHY.cardTitle,
        )}
      >
        {SHARE_LINK_PERMISSION_CLARITY_TITLE}
      </h3>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {SHARE_LINK_PERMISSION_CLARITY_INTRO}
      </p>
      <dl className="m-0 mt-3 grid gap-2">
        {rows.map((row) => (
          <div key={row.id} data-testid={`share-link-permission-clarity-${row.id}`}>
            <dt className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {row.label}
            </dt>
            <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{row.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}