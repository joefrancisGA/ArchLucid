"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

type AdminOutboxSnapshot = {
  readonly authorityPipelineWorkPending?: number;
  readonly authorityPipelineWorkDeadLetter?: number;
  readonly retrievalIndexingPending?: number;
  readonly integrationEventOutboxPublishPending?: number;
  readonly integrationEventOutboxDeadLetter?: number;
};

function toneClass(count: number): string {
  if (count <= 0)
    return "text-neutral-800 dark:text-neutral-200";

  if (count >= 10)
    return "font-semibold text-red-800 dark:text-red-200";

  return "font-semibold text-amber-800 dark:text-amber-200";
}

/** Partial-failure / queue operator view for authority and integration outboxes (assessment #16). */
export function OperatorOutboxDiagnosticsCard(): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<AdminOutboxSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(
          "/api/proxy/v1/admin/diagnostics/outboxes",
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
        );

        if (!response.ok) {
          if (!cancelled)
            setError("Admin diagnostics unavailable for this account.");

          return;
        }

        const payload = (await response.json()) as AdminOutboxSnapshot;

        if (!cancelled) {
          setSnapshot(payload);
          setError(null);
        }
      } catch {
        if (!cancelled)
          setError("Could not load outbox diagnostics.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card data-testid="operator-outbox-diagnostics-card">
      <CardHeader>
        <CardTitle className="text-base">Queue and partial-failure status</CardTitle>
        <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">
          Pending async work and dead-letter depths from{" "}
          <span className="font-mono text-xs">GET /v1/admin/diagnostics/outboxes</span>.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {error !== null ? (
          <p className="m-0 text-neutral-600 dark:text-neutral-400" role="status">
            {error}
          </p>
        ) : null}

        {snapshot !== null ? (
          <dl className="m-0 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">Authority pipeline pending</dt>
              <dd className={`m-0 tabular-nums ${toneClass(snapshot.authorityPipelineWorkPending ?? 0)}`}>
                {snapshot.authorityPipelineWorkPending ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">Authority pipeline dead-letter</dt>
              <dd className={`m-0 tabular-nums ${toneClass(snapshot.authorityPipelineWorkDeadLetter ?? 0)}`}>
                {snapshot.authorityPipelineWorkDeadLetter ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">Retrieval indexing pending</dt>
              <dd className={`m-0 tabular-nums ${toneClass(snapshot.retrievalIndexingPending ?? 0)}`}>
                {snapshot.retrievalIndexingPending ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">Integration publish pending</dt>
              <dd className={`m-0 tabular-nums ${toneClass(snapshot.integrationEventOutboxPublishPending ?? 0)}`}>
                {snapshot.integrationEventOutboxPublishPending ?? 0}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-neutral-500">Integration dead-letter</dt>
              <dd className={`m-0 tabular-nums ${toneClass(snapshot.integrationEventOutboxDeadLetter ?? 0)}`}>
                {snapshot.integrationEventOutboxDeadLetter ?? 0}
              </dd>
            </div>
          </dl>
        ) : null}

        <p className="m-0">
          <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/operate/integration-events/dlq">
            Open integration dead-letter queue
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
