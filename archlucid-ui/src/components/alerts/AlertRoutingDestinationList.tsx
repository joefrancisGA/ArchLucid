"use client";

import { cn } from "@/lib/utils";

import {
  alertRoutingDeliveryAttemptsButtonLabelReaderRank,
  alertRoutingDeliveryAttemptsButtonTitleOperator,
  alertRoutingDeliveryAttemptsButtonTitleReader,
  alertRoutingToggleToDisabledReaderRank,
  alertRoutingToggleToEnabledReaderRank,
  enterpriseMutationControlDisabledTitle,
} from "@/lib/enterprise-controls-context-copy";
import {
  channelDisplayLabel,
  formatAlertRoutingFiltersSummary,
  isWebhookChannelType,
} from "@/lib/alert-routing-form";
import { parseAlertRoutingCriteriaFromMetadata } from "@/lib/alert-routing-criteria";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AlertRoutingDeliveryAttempt, AlertRoutingSubscription } from "@/types/alert-routing";

export type AlertRoutingDestinationListProps = {
  items: AlertRoutingSubscription[];
  attemptsBySub: Record<string, AlertRoutingDeliveryAttempt[]>;
  canMutateRouting: boolean;
  testingId: string | null;
  onRefresh: () => void;
  loading: boolean;
  onAddDestination: () => void;
  onToggle: (id: string) => void;
  onLoadAttempts: (id: string) => void;
  onTest: (id: string) => void;
};

export function AlertRoutingDestinationList({
  items,
  attemptsBySub,
  canMutateRouting,
  testingId,
  onRefresh,
  loading,
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
        <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          No notification destinations configured
        </h3>
        <p className={cn("mt-2 max-w-prose text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Create a destination to receive email, webhook, Teams, or Slack notifications when alert conditions are met.
        </p>
        {canMutateRouting ? (
          <button
            type="button"
            className="mt-4 rounded-md bg-[var(--al-primary)] px-4 py-2 font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-focus-ring)]"
            onClick={onAddDestination}
          >
            Add notification destination
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="alert-routing-destination-list">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh notification destinations"
          title="Refresh notification destinations"
          className="rounded-md border border-neutral-300 px-2 py-1 text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-focus-ring)] dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-900"
        >
          {loading ? "Refreshing…" : "↻"}
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-neutral-50 dark:bg-neutral-900/60">
            <tr>
              {["Name", "Channel", "Destination", "Threshold", "Filters", "Delivery", "Actions"].map((heading) => (
                <th key={heading} scope="col" className={cn("px-3 py-2 font-medium text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.badge)}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const criteria = parseAlertRoutingCriteriaFromMetadata(item.metadataJson);

              return (
                <tr key={item.routingSubscriptionId} className="border-t border-neutral-200 dark:border-neutral-700">
                  <td className={cn("px-3 py-3 align-top", OPERATOR_TYPOGRAPHY.body)}>{item.name}</td>
                  <td className={cn("px-3 py-3 align-top", OPERATOR_TYPOGRAPHY.body)}>{channelDisplayLabel(item.channelType)}</td>
                  <td className={cn("max-w-xs break-all px-3 py-3 align-top font-mono", OPERATOR_TYPOGRAPHY.badge)}>
                    {item.destination}
                  </td>
                  <td className={cn("px-3 py-3 align-top", OPERATOR_TYPOGRAPHY.body)}>{item.minimumSeverity}</td>
                  <td className={cn("max-w-xs px-3 py-3 align-top", OPERATOR_TYPOGRAPHY.helper)}>
                    {formatAlertRoutingFiltersSummary({
                      minimumSeverity: item.minimumSeverity,
                      severities: criteria.severities,
                      findingTypes: criteria.findingTypes,
                      tags: criteria.tags,
                    })}
                  </td>
                  <td className={cn("px-3 py-3 align-top", OPERATOR_TYPOGRAPHY.body)}>
                    <div>{item.isEnabled ? "Enabled" : "Disabled"}</div>
                    <div className={OPERATOR_TYPOGRAPHY.helper}>
                      Last success:{" "}
                      {item.lastDeliveredUtc ? new Date(item.lastDeliveredUtc).toLocaleString() : "Not yet"}
                    </div>
                  </td>
                  <td className={cn("px-3 py-3 align-top", OPERATOR_TYPOGRAPHY.body)}>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onLoadAttempts(item.routingSubscriptionId)}
                        title={
                          canMutateRouting
                            ? alertRoutingDeliveryAttemptsButtonTitleOperator
                            : alertRoutingDeliveryAttemptsButtonTitleReader
                        }
                      >
                        {canMutateRouting ? "Delivery history" : alertRoutingDeliveryAttemptsButtonLabelReaderRank}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggle(item.routingSubscriptionId)}
                        disabled={!canMutateRouting}
                        title={canMutateRouting ? undefined : enterpriseMutationControlDisabledTitle}
                      >
                        {canMutateRouting
                          ? item.isEnabled
                            ? "Disable"
                            : "Enable"
                          : item.isEnabled
                            ? alertRoutingToggleToDisabledReaderRank
                            : alertRoutingToggleToEnabledReaderRank}
                      </button>
                      {isWebhookChannelType(item.channelType) ? (
                        <button
                          type="button"
                          onClick={() => onTest(item.routingSubscriptionId)}
                          disabled={testingId !== null}
                          data-testid={`webhook-test-${item.routingSubscriptionId}`}
                        >
                          {testingId === item.routingSubscriptionId ? "Testing…" : "Test"}
                        </button>
                      ) : null}
                    </div>
                    {attemptsBySub[item.routingSubscriptionId]?.length ? (
                      <ul className={cn("mt-2 pl-4", OPERATOR_TYPOGRAPHY.helper)}>
                        {attemptsBySub[item.routingSubscriptionId].map((attempt) => (
                          <li key={attempt.alertDeliveryAttemptId}>
                            {attempt.status} — {new Date(attempt.attemptedUtc).toLocaleString()}
                            {attempt.errorMessage ? ` — ${attempt.errorMessage}` : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
