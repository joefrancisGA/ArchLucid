"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import {
  alertRoutingDeliveryAttemptsButtonLabelReaderRank,
  alertRoutingDeliveryAttemptsButtonTitleOperator,
  alertRoutingDeliveryAttemptsButtonTitleReader,
  alertRoutingToggleToDisabledReaderRank,
  alertRoutingToggleToEnabledReaderRank,
} from "@/lib/enterprise-controls-context-copy";
import {
  channelDisplayLabel,
  formatAlertRoutingFiltersSummary,
  isWebhookChannelType,
} from "@/lib/alert-routing-form";
import { alertRoutingRowDeliveryStatus } from "@/lib/alert-routing-presentation";
import { parseAlertRoutingCriteriaFromMetadata } from "@/lib/alert-routing-criteria";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AlertRoutingDeliveryAttempt, AlertRoutingSubscription } from "@/types/alert-routing";

export type AlertRoutingDestinationListProps = {
  items: AlertRoutingSubscription[];
  attemptsBySub: Record<string, AlertRoutingDeliveryAttempt[]>;
  canMutateRouting: boolean;
  testingId: string | null;
  onAddDestination: () => void;
  onToggle: (id: string, isEnabled: boolean, subscriptionName: string, channelType: string) => void;
  onLoadAttempts: (id: string) => void;
  onTest: (id: string) => void;
};

export function AlertRoutingDestinationList({
  items,
  attemptsBySub,
  canMutateRouting,
  testingId,
  onAddDestination,
  onToggle,
  onLoadAttempts,
  onTest,
}: AlertRoutingDestinationListProps) {
  if (items.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-900/40"
        data-testid="alert-routing-empty-state"
      >
        <h4 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          No notification destinations configured
        </h4>
        <p className={cn("mt-2 max-w-prose text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Create a destination to receive email, webhook, Teams, or Slack notifications when qualifying findings meet your severity threshold.
        </p>
        {canMutateRouting ? (
          <Button type="button" variant="outline" className="mt-4" onClick={onAddDestination}>
            Go to destination form
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="alert-routing-destination-list">
      <EnterpriseTable ariaLabel="Notification destinations">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            {["Name", "Channel", "Destination", "Threshold", "Filters", "Delivery", "Actions"].map((heading) => (
              <EnterpriseTableHeaderCell key={heading}>{heading}</EnterpriseTableHeaderCell>
            ))}
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {items.map((item) => {
            const criteria = parseAlertRoutingCriteriaFromMetadata(item.metadataJson);
            const deliveryStatus = alertRoutingRowDeliveryStatus(item);
            const attempts = attemptsBySub[item.routingSubscriptionId] ?? [];

            return (
              <EnterpriseTableRow key={item.routingSubscriptionId}>
                <EnterpriseTableCell className={OPERATOR_TYPOGRAPHY.body}>{item.name}</EnterpriseTableCell>
                <EnterpriseTableCell className={OPERATOR_TYPOGRAPHY.body}>
                  {channelDisplayLabel(item.channelType)}
                </EnterpriseTableCell>
                <EnterpriseTableCell className={cn("max-w-xs break-all font-mono", OPERATOR_TYPOGRAPHY.badge)}>
                  {item.destination}
                </EnterpriseTableCell>
                <EnterpriseTableCell className={OPERATOR_TYPOGRAPHY.body}>{item.minimumSeverity}</EnterpriseTableCell>
                <EnterpriseTableCell className={cn("max-w-xs", OPERATOR_TYPOGRAPHY.helper)}>
                  {formatAlertRoutingFiltersSummary({
                    minimumSeverity: item.minimumSeverity,
                    severities: criteria.severities,
                    findingTypes: criteria.findingTypes,
                    tags: criteria.tags,
                  })}
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <StatusTag
                    kind={deliveryStatus.kind}
                    label={deliveryStatus.label}
                    data-testid={`alert-routing-delivery-status-${item.routingSubscriptionId}`}
                  />
                  <div className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                    Last success:{" "}
                    {item.lastDeliveredUtc ? formatInstantForLocale(item.lastDeliveredUtc) : "Not yet"}
                  </div>
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onLoadAttempts(item.routingSubscriptionId)}
                      title={
                        canMutateRouting
                          ? alertRoutingDeliveryAttemptsButtonTitleOperator
                          : alertRoutingDeliveryAttemptsButtonTitleReader
                      }
                    >
                      {canMutateRouting ? "Delivery history" : alertRoutingDeliveryAttemptsButtonLabelReaderRank}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onToggle(
                          item.routingSubscriptionId,
                          item.isEnabled === true,
                          item.name,
                          item.channelType,
                        )
                      }
                      disabled={!canMutateRouting}
                      data-testid={`alert-routing-toggle-${item.routingSubscriptionId}`}
                    >
                      {canMutateRouting
                        ? item.isEnabled
                          ? "Disable"
                          : "Enable"
                        : item.isEnabled
                          ? alertRoutingToggleToDisabledReaderRank
                          : alertRoutingToggleToEnabledReaderRank}
                    </Button>
                    {isWebhookChannelType(item.channelType) ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onTest(item.routingSubscriptionId)}
                        disabled={testingId !== null}
                        data-testid={`webhook-test-${item.routingSubscriptionId}`}
                      >
                        {testingId === item.routingSubscriptionId ? "Testing…" : "Test"}
                      </Button>
                    ) : null}
                  </div>
                  {attempts.length > 0 ? (
                    <ul className={cn("mt-2 list-disc pl-4", OPERATOR_TYPOGRAPHY.helper)}>
                      {attempts.map((attempt) => (
                        <li key={attempt.alertDeliveryAttemptId}>
                          {attempt.status} — {new Date(attempt.attemptedUtc).toLocaleString()}
                          {attempt.errorMessage ? ` — ${attempt.errorMessage}` : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            );
          })}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}
