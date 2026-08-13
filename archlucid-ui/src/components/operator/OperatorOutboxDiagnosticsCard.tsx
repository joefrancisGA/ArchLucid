"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminOutboxDiagnosticsQuery } from "@/hooks/use-admin-outbox-diagnostics-query";
import type { AdminOutboxSnapshot } from "@/lib/fetch-admin-outbox-diagnostics";

function toneClass(count: number): string {
  if (count <= 0)
    return "text-neutral-800 dark:text-neutral-200";

  if (count >= 10)
    return "font-semibold text-red-800 dark:text-red-200";

  return "font-semibold text-amber-800 dark:text-amber-200";
}

/** Partial-failure / queue operator view for authority and integration outboxes (assessment #16). */
export function OperatorOutboxDiagnosticsCard(): React.JSX.Element {
  const { data: snapshot, isPending } = useAdminOutboxDiagnosticsQuery();
  const error =
    !isPending && snapshot === null ? "Admin diagnostics unavailable for this account." : null;

  return (
    <Card data-testid="operator-outbox-diagnostics-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.body}>Queue and partial-failure status</CardTitle>
        <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Pending async work and dead-letter queue depths for authority pipeline and integration events.
        </p>
      </CardHeader>
      <CardContent className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body)}>
        {error !== null ? (
          <p className="m-0 text-neutral-600 dark:text-neutral-400" role="status">
            {error}
          </p>
        ) : null}

        {snapshot != null ? (
          <OperatorOutboxDiagnosticsMetrics snapshot={snapshot} />
        ) : null}

        <p className="m-0">
          <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/internal/integration-events/dlq">
            Open integration dead-letter queue
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function OperatorOutboxDiagnosticsMetrics(props: { readonly snapshot: AdminOutboxSnapshot }) {
  const { snapshot } = props;

  return (
    <dl className="m-0 grid gap-2 sm:grid-cols-2">
      <div>
        <dt className={cn("uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Authority pipeline pending</dt>
        <dd className={`m-0 tabular-nums ${toneClass(snapshot.authorityPipelineWorkPending ?? 0)}`}>
          {snapshot.authorityPipelineWorkPending ?? 0}
        </dd>
      </div>
      <div>
        <dt className={cn("uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Authority pipeline dead-letter</dt>
        <dd className={`m-0 tabular-nums ${toneClass(snapshot.authorityPipelineWorkDeadLetter ?? 0)}`}>
          {snapshot.authorityPipelineWorkDeadLetter ?? 0}
        </dd>
      </div>
      <div>
        <dt className={cn("uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Retrieval indexing pending</dt>
        <dd className={`m-0 tabular-nums ${toneClass(snapshot.retrievalIndexingPending ?? 0)}`}>
          {snapshot.retrievalIndexingPending ?? 0}
        </dd>
      </div>
      <div>
        <dt className={cn("uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Integration publish pending</dt>
        <dd className={`m-0 tabular-nums ${toneClass(snapshot.integrationEventOutboxPublishPending ?? 0)}`}>
          {snapshot.integrationEventOutboxPublishPending ?? 0}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className={cn("uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Integration dead-letter</dt>
        <dd className={`m-0 tabular-nums ${toneClass(snapshot.integrationEventOutboxDeadLetter ?? 0)}`}>
          {snapshot.integrationEventOutboxDeadLetter ?? 0}
        </dd>
      </div>
    </dl>
  );
}
