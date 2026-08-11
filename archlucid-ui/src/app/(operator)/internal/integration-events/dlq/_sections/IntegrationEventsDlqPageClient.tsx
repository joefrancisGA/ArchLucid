"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { WebhooksVsDlqVocabularyRail } from "@/components/WebhooksVsDlqVocabularyRail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import type { components } from "@/lib/api-types.generated";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";
import { DESIGN_TOKENS, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type IntegrationEventOutboxDeadLetterRow = components["schemas"]["IntegrationEventOutboxDeadLetterRow"];

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; rows: IntegrationEventOutboxDeadLetterRow[] }
  | { status: "blocked"; message: string };

const listPath = "/api/proxy/v1/admin/integration-outbox/dead-letters?maxRows=100";
const bulkRetryPath = "/api/proxy/v1/internal/integrations/outbox/retry-dead-letter";

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
  // Retry/suppress/bulk-retry are AdminAuthority on the API (AdminController) and operate across every tenant's
  // dead-lettered events, not just the caller's own — gate the shell so a non-Admin who reaches this route directly
  // (the nav item itself is hidden from non-Admins) sees disabled controls instead of a live button that 403s.
  const canMutate = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;
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
      if (!canMutate) {
        return;
      }

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
    [canMutate, load],
  );

  const suppress = useCallback(
    async (outboxId: string) => {
      if (!canMutate) {
        return;
      }

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
    [canMutate, load],
  );

  const bulkRetry = useCallback(async () => {
    if (!canMutate) {
      return;
    }

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
  }, [canMutate, load]);

  return (
    <div className="w-full max-w-[1200px] space-y-6" data-testid="integration-events-dlq-page">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Integration event dead letters</h1>
          <PageContextualHelpButton />
        </div>
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Inspect outbound integration events that exceeded publish retries and requeue them after fixing the root cause.
        </p>
        <WebhooksVsDlqVocabularyRail currentSurfaceId="dlq" />
        {!canMutate ? (
          <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Administrator access required to retry or suppress dead-letter rows.
          </p>
        ) : null}
      </header>
<div
        className={cn(DESIGN_TOKENS.callout.warn, "px-4 py-3")}
        role="status"
        data-testid="integration-events-dlq-cross-tenant-callout"
      >
        <p className="m-0 font-semibold">Cross-tenant Internal Operations queue</p>
        <p className="m-0 mt-1">
          Dead letters span all tenants and event types — not your current workspace only. Fix the root cause before
          bulk retry.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>Dead-letter queue</CardTitle>
            <CardDescription>
              List and bulk retry operate across all tenants and event types (Internal Operations staff surface). Retry
              clears dead-letter state for the worker to publish again. Suppress marks a row processed without
              republishing.
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={bulkRetrying || state.status === "loading" || !canMutate}
              title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
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
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading dead letters…</p>
          ) : null}
          {state.status === "blocked" ? (
            <OperatorApiProblem fallbackMessage={state.message} problem={null} />
          ) : null}
          {state.status === "ready" && state.rows.length === 0 ? (
            <p className={cn("m-0 text-emerald-800 dark:text-emerald-300", OPERATOR_TYPOGRAPHY.body)}>
              No dead-lettered integration events.
            </p>
          ) : null}
          {state.status === "ready" && state.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={cn("min-w-full text-left", OPERATOR_TYPOGRAPHY.body)}>
                <thead>
                  <tr className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                    <th className="py-2 pr-3">Tenant</th>
                    <th className="py-2 pr-3">Event</th>
                    <th className="py-2 pr-3">Review</th>
                    <th className="py-2 pr-3">Age</th>
                    <th className="py-2 pr-3">Dead-lettered (UTC)</th>
                    <th className="py-2 pr-3">Retries</th>
                    <th className="py-2 pr-3">Last error</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {state.rows.map((row) => (
                    <tr key={row.outboxId} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className={cn("py-2 pr-3 align-top font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>
                        {row.tenantId ?? "—"}
                      </td>
                      <td className={cn("py-2 pr-3 align-top font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>
                        {row.eventType}
                      </td>
                      <td className={cn("py-2 pr-3 align-top font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>
                        {row.runId ?? "—"}
                      </td>
                      <td className={cn("py-2 pr-3 align-top", OPERATOR_TYPOGRAPHY.helper)}>{formatAgeUtc(row.deadLetteredUtc)}</td>
                      <td className={cn("py-2 pr-3 align-top", OPERATOR_TYPOGRAPHY.helper)}>{row.deadLetteredUtc}</td>
                      <td className={cn("py-2 pr-3 align-top", OPERATOR_TYPOGRAPHY.helper)}>{row.retryCount}</td>
                      <td className={cn("max-w-md py-2 pr-3 align-top text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
                        {row.lastErrorMessage ?? "—"}
                      </td>
                      <td className="py-2 align-top">
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={retryingId === row.outboxId || suppressingId === row.outboxId || !canMutate}
                            title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
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
                            disabled={retryingId === row.outboxId || suppressingId === row.outboxId || !canMutate}
                            title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
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
                            variant="outline"
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
