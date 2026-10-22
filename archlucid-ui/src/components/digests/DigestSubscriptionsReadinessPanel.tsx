"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  buildDigestSubscriptionReadinessSummary,
  type DigestSubscriptionReadinessSummary,
} from "@/lib/digest-subscriptions-workflow";
import type { DigestSubscription } from "@/types/digest-subscriptions";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

export type DigestSubscriptionsReadinessPanelProps = {
  readonly healthSnap: WeeklyDigestHealthDto | null;
  readonly subscriptions: readonly DigestSubscription[];
  readonly onAddDeliveryDestination?: () => void;
};

export function DigestSubscriptionsReadinessPanel(
  props: DigestSubscriptionsReadinessPanelProps,
): ReactElement {
  const summary: DigestSubscriptionReadinessSummary = buildDigestSubscriptionReadinessSummary(
    props.healthSnap,
    props.subscriptions,
  );

  const overallKind =
    summary.blockingIssue === null ? ("ready" as const) : ("needs-attention" as const);
  const overallLabel = summary.blockingIssue === null ? "Ready to deliver" : "Action needed";

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="digest-subscriptions-readiness-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Delivery readiness
        </h3>
        <StatusTag kind={overallKind} label={overallLabel} />
      </div>

      {summary.blockingIssue !== null ? (
        <div
          className={cn(
            "mt-3 flex flex-wrap items-start justify-between gap-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="digest-subscriptions-readiness-blocking"
          role="status"
        >
          <p className="m-0">{summary.blockingIssue}</p>
          {summary.nextActionLabel !== null ? (
            summary.nextActionHref !== null ? (
              <Button asChild size="sm" variant="primary">
                <Link href={summary.nextActionHref}>{summary.nextActionLabel}</Link>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={props.onAddDeliveryDestination}
                data-testid="digest-subscriptions-readiness-add-destination"
              >
                {summary.nextActionLabel}
              </Button>
            )
          ) : null}
        </div>
      ) : null}

      <dl className="mt-3 grid gap-3 md:grid-cols-2">
        {summary.rows.map((row) => (
          <div key={row.id} className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
            <dt className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {row.label}
            </dt>
            <dd className={cn("m-0 mt-0.5 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
              {row.value}
            </dd>
            <dd className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {row.detail}
            </dd>
            {row.href !== null ? (
              <dd className="m-0 mt-2">
                <Link className="text-al-link underline-offset-2 hover:underline" href={row.href}>
                  Open schedule setup
                </Link>
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  );
}
