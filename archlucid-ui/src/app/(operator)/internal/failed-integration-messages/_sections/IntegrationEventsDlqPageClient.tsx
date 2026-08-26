"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  IntegrationEventsDlqBulkRetryConfirmDialog,
  IntegrationEventsDlqSuppressConfirmDialog,
} from "@/app/(operator)/internal/failed-integration-messages/_sections/IntegrationEventsDlqConfirmDialogs";
import { IntegrationEventsDlqTable } from "@/app/(operator)/internal/failed-integration-messages/_sections/IntegrationEventsDlqTable";
import {
  rowMatchesFilters,
  type IntegrationEventOutboxDeadLetterRow,
} from "@/app/(operator)/internal/failed-integration-messages/_sections/integration-events-dlq-presentation";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { WebhooksVsDlqVocabularyRail } from "@/components/WebhooksVsDlqVocabularyRail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshButton } from "@/components/ui/refresh-button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { IntegrationEventsDlqEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { INTERNAL_INTEGRATION_EVENTS_DLQ_PATH } from "@/lib/internal-ops-route-paths";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  INTEGRATION_EVENTS_DLQ_PAGE_SUBTITLE,
  INTEGRATION_EVENTS_DLQ_PAGE_TITLE,
  integrationEventsDlqBulkRetryFailedMessage,
  integrationEventsDlqCopyCurlFailedMessage,
  integrationEventsDlqListBlockedMessage,
  integrationEventsDlqRetryFailedMessage,
  integrationEventsDlqSuppressFailedMessage,
} from "@/lib/integration-events-dlq-page-copy";
import {
  INTEGRATION_EVENTS_DLQ_EMPTY_COMPACT,
  INTEGRATION_EVENTS_DLQ_FILTER_EMPTY_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";
import { cn } from "@/lib/utils";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; rows: IntegrationEventOutboxDeadLetterRow[] }
  | { status: "blocked"; message: string };

const listPath = "/api/proxy/v1/admin/integration-outbox/dead-letters?maxRows=100";
const bulkRetryPath = "/api/proxy/v1/internal/integrations/outbox/retry-dead-letter";

/** Admin operator view for failed integration event outbox rows with manual retry. */
export function IntegrationEventsDlqPageClient() {
  // Retry/suppress/bulk-retry are AdminAuthority on the API (AdminController) and operate across every tenant's
  // dead-lettered events, not just the caller's own — gate the shell so a non-Admin who reaches this route directly
  // (the nav item itself is hidden from non-Admins) sees disabled controls instead of a live button that 403s.
  const canMutate = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;
  const mutationDisabledHintId = "integration-events-dlq-mutate-disabled-hint";
  const mutationDisabledReason = canMutate ? null : whyDisabledEnterpriseMutationControl();
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [suppressingId, setSuppressingId] = useState<string | null>(null);
  const [bulkRetrying, setBulkRetrying] = useState(false);
  const [bulkRetryDialogOpen, setBulkRetryDialogOpen] = useState(false);
  const [bulkRetryAcknowledgment, setBulkRetryAcknowledgment] = useState("");
  const [suppressTargetId, setSuppressTargetId] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("");

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
          message: integrationEventsDlqListBlockedMessage(response.status),
        });

        return;
      }

      const rows = (await response.json()) as IntegrationEventOutboxDeadLetterRow[];
      setState({ status: "ready", rows });
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      setState({
        status: "blocked",
        message: `${integrationEventsDlqListBlockedMessage(0)} ${detail}`.trim(),
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const eventTypeOptions = useMemo(() => {
    if (state.status !== "ready") {
      return [] as string[];
    }

    return [...new Set(state.rows.map((row) => row.eventType).filter((value): value is string => Boolean(value)))].sort();
  }, [state]);

  const filteredRows = useMemo(() => {
    if (state.status !== "ready") {
      return [] as IntegrationEventOutboxDeadLetterRow[];
    }

    return state.rows.filter((row) => rowMatchesFilters(row, eventTypeFilter, tenantFilter));
  }, [eventTypeFilter, state, tenantFilter]);

  const copyCurl = useCallback(async (outboxId: string) => {
    try {
      const response = await fetch(
        `/api/proxy/v1/admin/integration-outbox/dead-letters/${encodeURIComponent(outboxId)}/curl`,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (!response.ok) {
        showError("Copy as cURL failed", integrationEventsDlqCopyCurlFailedMessage());

        return;
      }

      const body = (await response.json()) as { curlCommand?: string };

      if (!body.curlCommand) {
        showError("Copy as cURL failed", integrationEventsDlqCopyCurlFailedMessage());

        return;
      }

      await navigator.clipboard.writeText(body.curlCommand);
      showSuccess("cURL command copied to clipboard.");
    } catch (error: unknown) {
      showError(
        "Copy as cURL failed",
        error instanceof Error ? error.message : integrationEventsDlqCopyCurlFailedMessage(),
      );
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
          showError("Retry failed", integrationEventsDlqRetryFailedMessage());

          return;
        }

        showSuccess("Failed message queued for retry.");
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
          showError("Suppress failed", integrationEventsDlqSuppressFailedMessage());

          return;
        }

        showSuccess("Failed message suppressed.");
        await load();
      } finally {
        setSuppressingId(null);
        setSuppressTargetId(null);
      }
    },
    [canMutate, load],
  );

  const bulkRetry = useCallback(async () => {
    if (!canMutate) {
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
        showError("Bulk retry failed", integrationEventsDlqBulkRetryFailedMessage());

        return;
      }

      const body = (await response.json()) as { retriedCount?: number };
      const count = body.retriedCount ?? 0;
      showSuccess(count > 0 ? `Queued ${count} failed message(s) for retry.` : "No failed messages matched.");
      setBulkRetryDialogOpen(false);
      setBulkRetryAcknowledgment("");
      await load();
    } catch (error: unknown) {
      showError(
        "Bulk retry failed",
        error instanceof Error ? error.message : integrationEventsDlqBulkRetryFailedMessage(),
      );
    } finally {
      setBulkRetrying(false);
    }
  }, [canMutate, load]);

  return (
    <OperatorPageContainer
      variant="dashboard"
      className={OPERATOR_LAYOUT.sectionStack}
      data-testid="integration-events-dlq-page"
    >
      <OperatorPageHeader
        navHref={INTERNAL_INTEGRATION_EVENTS_DLQ_PATH}
        title={INTEGRATION_EVENTS_DLQ_PAGE_TITLE}
        titleTestId="integration-events-dlq-page-title"
        headingLevel="h1"
        subtitle={INTEGRATION_EVENTS_DLQ_PAGE_SUBTITLE}
        actions={<PageContextualHelpButton />}
      >
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Internal Operations staff may also see these rows described as dead letters in API or runbook vocabulary.
        </p>
        <WebhooksVsDlqVocabularyRail currentSurfaceId="dlq" />
        {!canMutate ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Administrator access required to retry or suppress failed integration messages.
          </p>
        ) : null}
      </OperatorPageHeader>

      <IntegrationEventsDlqEvidenceOrientationStrip />

      <div
        className={cn(DESIGN_TOKENS.callout.warn, "px-4 py-3")}
        role="status"
        data-testid="integration-events-dlq-cross-tenant-callout"
      >
        <p className="m-0 font-semibold">Cross-tenant Internal Operations queue</p>
        <p className="m-0 mt-1">
          Failed messages span all tenants and event types — not your current workspace only. Fix the root cause before
          bulk retry.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>Failed message queue</CardTitle>
            <CardDescription>
              List and bulk retry operate across all tenants and event types (Internal Operations staff surface). Retry
              clears dead-letter state for the worker to publish again. Suppress marks a row processed without
              republishing.
            </CardDescription>
          </div>
          <div
            className="flex shrink-0 flex-wrap items-center gap-2"
            data-testid="integration-events-dlq-header-actions"
          >
            <RefreshButton
              variant="primary"
              data-testid="integration-events-dlq-refresh-button"
              onClick={() => void load()}
              busy={state.status === "loading"}
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              data-testid="integration-events-dlq-bulk-retry-button"
              disabled={bulkRetrying || state.status === "loading" || !canMutate}
              aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
              onClick={() => {
                setBulkRetryAcknowledgment("");
                setBulkRetryDialogOpen(true);
              }}
            >
              Bulk retry (100)
            </Button>
          </div>
          <WhyDisabledCtaHint
            id={mutationDisabledHintId}
            reason={mutationDisabledReason}
            testId={mutationDisabledHintId}
          />
        </CardHeader>
        <CardContent className={OPERATOR_LAYOUT.sectionStack}>
          {state.status === "ready" && state.rows.length > 0 ? (
            <div
              className={cn("grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]", OPERATOR_LAYOUT.inlineGap)}
              data-testid="integration-events-dlq-filters"
            >
              <div className="space-y-1">
                <Label htmlFor="integration-events-dlq-event-type-filter" className={OPERATOR_TYPOGRAPHY.label}>
                  Event type
                </Label>
                <select
                  id="integration-events-dlq-event-type-filter"
                  className={cn(
                    "h-9 w-full rounded-md border border-neutral-300 bg-white px-3 dark:border-neutral-600 dark:bg-neutral-950",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                  value={eventTypeFilter}
                  data-testid="integration-events-dlq-event-type-filter"
                  onChange={(event) => {
                    setEventTypeFilter(event.target.value);
                  }}
                >
                  <option value="all">All event types</option>
                  {eventTypeOptions.map((eventType) => (
                    <option key={eventType} value={eventType}>
                      {eventType}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="integration-events-dlq-tenant-filter" className={OPERATOR_TYPOGRAPHY.label}>
                  Tenant contains
                </Label>
                <Input
                  id="integration-events-dlq-tenant-filter"
                  value={tenantFilter}
                  placeholder="Filter by tenant id substring"
                  data-testid="integration-events-dlq-tenant-filter"
                  onChange={(event) => {
                    setTenantFilter(event.target.value);
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="integration-events-dlq-clear-filters-button"
                  onClick={() => {
                    setEventTypeFilter("all");
                    setTenantFilter("");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          ) : null}

          {state.status === "loading" || state.status === "idle" ? (
            <OperatorLoadingNotice>Loading failed integration messages…</OperatorLoadingNotice>
          ) : null}
          {state.status === "blocked" ? (
            <OperatorApiProblem fallbackMessage={state.message} problem={null} />
          ) : null}
          {state.status === "ready" && state.rows.length === 0 ? (
            <EnterpriseCompactEmptyState {...INTEGRATION_EVENTS_DLQ_EMPTY_COMPACT} />
          ) : null}
          {state.status === "ready" && state.rows.length > 0 && filteredRows.length === 0 ? (
            <EnterpriseCompactEmptyState {...INTEGRATION_EVENTS_DLQ_FILTER_EMPTY_COMPACT} />
          ) : null}
          {state.status === "ready" && filteredRows.length > 0 ? (
            <IntegrationEventsDlqTable
              rows={filteredRows}
              canMutate={canMutate}
              retryingId={retryingId}
              suppressingId={suppressingId}
              mutationDisabledHintId={mutationDisabledHintId}
              mutationDisabledReason={mutationDisabledReason}
              onRetry={(outboxId) => {
                void retry(outboxId);
              }}
              onSuppressRequest={setSuppressTargetId}
              onCopyCurl={(outboxId) => {
                void copyCurl(outboxId);
              }}
            />
          ) : null}
        </CardContent>
      </Card>

      <IntegrationEventsDlqBulkRetryConfirmDialog
        open={bulkRetryDialogOpen}
        busy={bulkRetrying}
        filteredRowCount={filteredRows.length}
        acknowledgment={bulkRetryAcknowledgment}
        onAcknowledgmentChange={setBulkRetryAcknowledgment}
        onCancel={() => {
          if (bulkRetrying) {
            return;
          }

          setBulkRetryDialogOpen(false);
          setBulkRetryAcknowledgment("");
        }}
        onConfirm={() => {
          void bulkRetry();
        }}
      />

      <IntegrationEventsDlqSuppressConfirmDialog
        open={suppressTargetId !== null}
        busy={suppressingId !== null}
        onCancel={() => {
          if (suppressingId !== null) {
            return;
          }

          setSuppressTargetId(null);
        }}
        onConfirm={() => {
          if (suppressTargetId === null) {
            return;
          }

          void suppress(suppressTargetId);
        }}
      />
    </OperatorPageContainer>
  );
}
