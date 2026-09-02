"use client";

import { IntegrationEventsDlqTable } from "@/app/(operator)/internal/failed-integration-messages/_sections/IntegrationEventsDlqTable";
import type { IntegrationEventsDlqLoadState } from "@/app/(operator)/internal/failed-integration-messages/_sections/useIntegrationEventsDlqLoader";
import type { IntegrationEventOutboxDeadLetterRow } from "@/app/(operator)/internal/failed-integration-messages/_sections/integration-events-dlq-presentation";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  INTEGRATION_EVENTS_DLQ_EMPTY_COMPACT,
  INTEGRATION_EVENTS_DLQ_FILTER_EMPTY_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import { cn } from "@/lib/utils";

export type IntegrationEventsDlqQueueCardSectionProps = {
  readonly state: IntegrationEventsDlqLoadState;
  readonly onRefresh: () => void;
  readonly canMutate: boolean;
  readonly mutationDisabledHintId: string;
  readonly mutationDisabledReason: WhyDisabledCtaReason | null;
  readonly bulkRetrying: boolean;
  readonly onOpenBulkRetryDialog: () => void;
  readonly eventTypeFilter: string;
  readonly onEventTypeFilterChange: (value: string) => void;
  readonly tenantFilter: string;
  readonly onTenantFilterChange: (value: string) => void;
  readonly eventTypeOptions: readonly string[];
  readonly onClearFilters: () => void;
  readonly filteredRows: readonly IntegrationEventOutboxDeadLetterRow[];
  readonly retryingId: string | null;
  readonly suppressingId: string | null;
  readonly onRetry: (outboxId: string) => void;
  readonly onSuppressRequest: (outboxId: string) => void;
  readonly onCopyCurl: (outboxId: string) => void;
};

export function IntegrationEventsDlqQueueCardSection(
  props: IntegrationEventsDlqQueueCardSectionProps,
): React.JSX.Element {
  return (
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
        <div className="flex shrink-0 flex-wrap items-center gap-2" data-testid="integration-events-dlq-header-actions">
          <RefreshButton
            variant="primary"
            data-testid="integration-events-dlq-refresh-button"
            onClick={props.onRefresh}
            busy={props.state.status === "loading"}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            data-testid="integration-events-dlq-bulk-retry-button"
            disabled={props.bulkRetrying || props.state.status === "loading" || !props.canMutate}
            aria-describedby={props.mutationDisabledReason === null ? undefined : props.mutationDisabledHintId}
            onClick={props.onOpenBulkRetryDialog}
          >
            Bulk retry (100)
          </Button>
        </div>
        <WhyDisabledCtaHint
          id={props.mutationDisabledHintId}
          reason={props.mutationDisabledReason}
          testId={props.mutationDisabledHintId}
        />
      </CardHeader>
      <CardContent className={OPERATOR_LAYOUT.sectionStack}>
        {props.state.status === "ready" && props.state.rows.length > 0 ? (
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
                value={props.eventTypeFilter}
                data-testid="integration-events-dlq-event-type-filter"
                onChange={(event) => {
                  props.onEventTypeFilterChange(event.target.value);
                }}
              >
                <option value="all">All event types</option>
                {props.eventTypeOptions.map((eventType) => (
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
                value={props.tenantFilter}
                placeholder="Filter by tenant id substring"
                data-testid="integration-events-dlq-tenant-filter"
                onChange={(event) => {
                  props.onTenantFilterChange(event.target.value);
                }}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="integration-events-dlq-clear-filters-button"
                onClick={props.onClearFilters}
              >
                Clear filters
              </Button>
            </div>
          </div>
        ) : null}

        {props.state.status === "loading" || props.state.status === "idle" ? (
          <OperatorLoadingNotice>Loading failed integration messages…</OperatorLoadingNotice>
        ) : null}
        {props.state.status === "blocked" ? (
          <OperatorApiProblem fallbackMessage={props.state.message} problem={null} />
        ) : null}
        {props.state.status === "ready" && props.state.rows.length === 0 ? (
          <EnterpriseCompactEmptyState {...INTEGRATION_EVENTS_DLQ_EMPTY_COMPACT} />
        ) : null}
        {props.state.status === "ready" && props.state.rows.length > 0 && props.filteredRows.length === 0 ? (
          <EnterpriseCompactEmptyState {...INTEGRATION_EVENTS_DLQ_FILTER_EMPTY_COMPACT} />
        ) : null}
        {props.state.status === "ready" && props.filteredRows.length > 0 ? (
          <IntegrationEventsDlqTable
            rows={props.filteredRows}
            canMutate={props.canMutate}
            retryingId={props.retryingId}
            suppressingId={props.suppressingId}
            mutationDisabledHintId={props.mutationDisabledHintId}
            mutationDisabledReason={props.mutationDisabledReason}
            onRetry={props.onRetry}
            onSuppressRequest={props.onSuppressRequest}
            onCopyCurl={props.onCopyCurl}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
