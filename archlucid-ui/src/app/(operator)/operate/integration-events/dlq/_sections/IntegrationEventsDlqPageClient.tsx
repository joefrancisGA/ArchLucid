"use client";

import { useCallback, useEffect, useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { components } from "@/lib/api-types.generated";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";

type IntegrationEventOutboxDeadLetterRow = components["schemas"]["IntegrationEventOutboxDeadLetterRow"];

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; rows: IntegrationEventOutboxDeadLetterRow[] }
  | { status: "blocked"; message: string };

const listPath = "/api/proxy/v1/admin/integration-outbox/dead-letters?maxRows=100";
const bulkRetryPath = "/api/proxy/v1/admin/integrations/outbox/retry-dead-letter";

function formatAgeUtc(deadLetteredUtc: string | undefined | null): string {
  if (deadLetteredUtc === undefined || deadLetteredUtc === null || deadLetteredUtc === "") {
    return "—";
  }

  const deadLetteredMs = Date.parse(deadLetteredUtc);

  if (Number.isNaN(deadLetteredMs)) {
    return "—";
  }

  const ageMs = Math.max(0, Date.now() - deadLetteredMs);
  const minutes = Math.floor(ageMs / 60_000);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 48) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);

  return `${days}d`;
}

/** Admin operator view for failed integration event outbox rows with manual retry. */
export function IntegrationEventsDlqPageClient() {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [suppressingId, setSuppressingId] = useState<string | null>(null);
  const [bulkRetrying, setBulkRetrying] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const response = await fetch(
        listPath,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (!response.ok) {
        setState({
          status: "blocked",
          message:
            response.status === 401 || response.status === 403
              ? "Admin session required to inspect integration dead letters."
              : `Dead-letter list unavailable (HTTP ${response.status}).`,
        });

        return;
      }

      const rows = (await response.json()) as IntegrationEventOutboxDeadLetterRow[];
      setState({ status: "ready", rows });
    } catch (error: unknown) {
      setState({ status: "blocked", message: error instanceof Error ? error.message : String(error) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const copyCurl = useCallback(async (outboxId: string) => {
    try {
      const response = await fetch(
        `/api/proxy/v1/admin/integration-outbox/dead-letters/${encodeURIComponent(outboxId)}/curl`,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (!response.ok) {
        showError("Copy as cURL failed", `HTTP ${response.status}`);

        return;
      }

      const body = (await response.json()) as { curlCommand?: string };

      if (!body.curlCommand) {
        showError("Copy as cURL failed", "Empty cURL payload.");

        return;
      }

      await navigator.clipboard.writeText(body.curlCommand);
      showSuccess("cURL command copied to clipboard.");
    } catch (error: unknown) {
      showError("Copy as cURL failed", error instanceof Error ? error.message : String(error));
    }
  }, []);

  const retry = useCallback(
    async (outboxId: string) => {
      setRetryingId(outboxId);

      try {
        const response = await fetch(
          `/api/proxy/v1/admin/integration-outbox/dead-letters/${encodeURIComponent(outboxId)}/retry`,
          mergeRegistrationScopeForProxy({ method: "POST" }),
        );

        if (!response.ok) {
          showError("Retry failed", `HTTP ${response.status}`);

          return;
        }

        showSuccess("Dead-letter row queued for retry.");
        await load();
      } finally {
        setRetryingId(null);
      }
    },
    [load],
  );

  const suppress = useCallback(
    async (outboxId: string) => {
      if (
        !window.confirm(
          "Suppress this dead-letter row without republishing? Use when the event should not be retried.",
        )
      ) {
        return;
      }

      setSuppressingId(outboxId);

      try {
        const response = await fetch(
          `/api/proxy/v1/admin/integration-outbox/dead-letters/${encodeURIComponent(outboxId)}/suppress`,
          mergeRegistrationScopeForProxy({
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({}),
          }),
        );

        if (!response.ok) {
          showError("Suppress failed", `HTTP ${response.status}`);

          return;
        }

        showSuccess("Dead-letter row suppressed.");
        await load();
      } finally {
        setSuppressingId(null);
      }
    },
    [load],
  );

  const bulkRetry = useCallback(async () => {
    if (
      !window.confirm(
        "Retry up to 100 dead-letter rows (all tenants and event types)? Fix the root cause before bulk retry.",
      )
    ) {
      return;
    }

    setBulkRetrying(true);

    try {
      const response = await fetch(
        bulkRetryPath,
        mergeRegistrationScopeForProxy({
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ maxRows: 100 }),
        }),
      );

      if (!response.ok) {
        showError("Bulk retry failed", `HTTP ${response.status}`);

        return;
      }

      const body = (await response.json()) as { retriedCount?: number };
      const count = body.retriedCount ?? 0;
      showSuccess(count > 0 ? `Queued ${count} dead-letter row(s) for retry.` : "No dead-letter rows matched.");
      await load();
    } catch (error: unknown) {
      showError("Bulk retry failed", error instanceof Error ? error.message : String(error));
    } finally {
      setBulkRetrying(false);
    }
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl space-y-6" data-testid="integration-events-dlq-page">
      <header>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Integration event dead letters</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Inspect outbound integration events that exceeded publish retries and requeue them after fixing the root cause.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Dead-letter queue</CardTitle>
            <CardDescription>
              Rows are tenant-scoped; retry clears dead-letter state for the worker to publish again. Suppress marks a
              row processed without republishing.
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={bulkRetrying || state.status === "loading"}
              onClick={() => void bulkRetry()}
            >
              {bulkRetrying ? "Bulk retrying…" : "Bulk retry (100)"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={state.status === "loading"}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {state.status === "loading" || state.status === "idle" ? (
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">Loading dead letters…</p>
          ) : null}
          {state.status === "blocked" ? (
            <OperatorApiProblem fallbackMessage={state.message} problem={null} />
          ) : null}
          {state.status === "ready" && state.rows.length === 0 ? (
            <p className="m-0 text-sm text-emerald-800 dark:text-emerald-300">No dead-lettered integration events.</p>
          ) : null}
          {state.status === "ready" && state.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="py-2 pr-3 font-medium">Tenant</th>
                    <th className="py-2 pr-3 font-medium">Event</th>
                    <th className="py-2 pr-3 font-medium">Run</th>
                    <th className="py-2 pr-3 font-medium">Age</th>
                    <th className="py-2 pr-3 font-medium">Dead-lettered (UTC)</th>
                    <th className="py-2 pr-3 font-medium">Retries</th>
                    <th className="py-2 pr-3 font-medium">Last error</th>
                    <th className="py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {state.rows.map((row) => (
                    <tr key={row.outboxId} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2 pr-3 align-top font-mono text-xs">{row.tenantId ?? "—"}</td>
                      <td className="py-2 pr-3 align-top font-mono text-xs">{row.eventType}</td>
                      <td className="py-2 pr-3 align-top font-mono text-xs">{row.runId ?? "—"}</td>
                      <td className="py-2 pr-3 align-top text-xs">{formatAgeUtc(row.deadLetteredUtc)}</td>
                      <td className="py-2 pr-3 align-top text-xs">{row.deadLetteredUtc}</td>
                      <td className="py-2 pr-3 align-top text-xs">{row.retryCount}</td>
                      <td className="max-w-md py-2 pr-3 align-top text-xs text-neutral-700 dark:text-neutral-300">
                        {row.lastErrorMessage ?? "—"}
                      </td>
                      <td className="py-2 align-top">
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={retryingId === row.outboxId || suppressingId === row.outboxId}
                            onClick={() => {
                              if (row.outboxId === undefined || row.outboxId === null) {
                                return;
                              }

                              void retry(row.outboxId);
                            }}
                          >
                            {retryingId === row.outboxId ? "Retrying…" : "Retry"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={retryingId === row.outboxId || suppressingId === row.outboxId}
                            onClick={() => {
                              if (row.outboxId === undefined || row.outboxId === null) {
                                return;
                              }

                              void suppress(row.outboxId);
                            }}
                          >
                            {suppressingId === row.outboxId ? "Suppressing…" : "Suppress"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (row.outboxId === undefined || row.outboxId === null) {
                                return;
                              }

                              void copyCurl(row.outboxId);
                            }}
                          >
                            Copy as cURL
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
