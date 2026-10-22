"use client";

import { cn } from "@/lib/utils";

import { BooleanStatusChip } from "@/components/ui/boolean-status-chip";
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
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatWebhookDestinationLabel } from "@/lib/webhooks-destination-present";
import { formatWebhooksCustomerError } from "@/lib/webhooks-page-error-present";
import { WEBHOOKS_TEST_LABEL, WEBHOOKS_TESTING_LABEL } from "@/lib/webhooks-page-copy";
import { labelForWebhookEventId } from "@/lib/webhook-settings-form-schema";
import { summarizeMaskedWebhookSubscription, formatWebhookSubscriptionLastDeliveryLabel } from "@/lib/webhook-subscription-metadata";
import type { AlertRoutingSubscription, WebhookTestResponse } from "@/types/alert-routing";

export type WebhooksSubscriptionsTableProps = {
  readonly webhookRows: readonly AlertRoutingSubscription[];
  readonly testingId: string | null;
  readonly testResults: Record<string, WebhookTestResponse>;
  readonly canMutate: boolean;
  readonly loading: boolean;
  readonly onTestWebhook: (routingSubscriptionId: string) => void;
  readonly onToggle: (routingSubscriptionId: string, subscriptionName: string, isEnabled: boolean) => void;
};

export function WebhooksSubscriptionsTable(props: WebhooksSubscriptionsTableProps): React.JSX.Element {
  const { webhookRows, testingId, testResults, canMutate, loading, onTestWebhook, onToggle } = props;

  return (
    <EnterpriseTable ariaLabel="Webhook subscriptions" data-testid="webhooks-subscriptions-table">
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Destination</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Events</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Minimum severity</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Signing secret</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Last delivery</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {webhookRows.map((row) => {
          const masked = summarizeMaskedWebhookSubscription(row.metadataJson);
          const friendlyEventLabels = masked.eventTypes.map((eventId) => labelForWebhookEventId(eventId));
          const destinationLabel = formatWebhookDestinationLabel(row.destination);

          return (
            <EnterpriseTableRow
              key={row.routingSubscriptionId}
              data-testid={`webhook-subscription-${row.routingSubscriptionId}`}
              data-webhook-subscription-id={row.routingSubscriptionId}
            >
              <EnterpriseTableCell>
                <span className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{row.name}</span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{destinationLabel}</span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className={OPERATOR_TYPOGRAPHY.helper}>
                  {friendlyEventLabels.length > 0 ? friendlyEventLabels.join(", ") : " — "}
                </span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className={OPERATOR_TYPOGRAPHY.helper}>{row.minimumSeverity}</span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{masked.secretStatus}</span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <BooleanStatusChip
                  value={row.isEnabled === true}
                  trueLabel="Enabled"
                  falseLabel="Disabled"
                  data-testid={`webhook-enabled-${row.routingSubscriptionId}`}
                />
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {formatWebhookSubscriptionLastDeliveryLabel(row.lastDeliveredUtc)}
                </span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={testingId !== null}
                    onClick={() => onTestWebhook(row.routingSubscriptionId)}
                    data-testid={`webhook-test-${row.routingSubscriptionId}`}
                    aria-busy={testingId === row.routingSubscriptionId}
                  >
                    {testingId === row.routingSubscriptionId ? WEBHOOKS_TESTING_LABEL : WEBHOOKS_TEST_LABEL}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!canMutate || loading}
                    onClick={() => onToggle(row.routingSubscriptionId, row.name, row.isEnabled === true)}
                    data-testid={`webhook-toggle-${row.routingSubscriptionId}`}
                  >
                    {row.isEnabled === true ? "Disable" : "Enable"}
                  </Button>
                </div>
                {testResults[row.routingSubscriptionId] !== undefined ? (
                  <div
                    className={cn(
                      "mt-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/60",
                      OPERATOR_TYPOGRAPHY.body,
                    )}
                    data-testid={`webhook-test-result-${row.routingSubscriptionId}`}
                    role="status"
                  >
                    <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                      Latest test result
                    </p>
                    {testResults[row.routingSubscriptionId]!.transportSucceeded ? (
                      <p className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                        HTTP <span className="font-mono">{testResults[row.routingSubscriptionId]!.statusCode}</span>
                      </p>
                    ) : (
                      <p className={cn("m-0 mt-1 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
                        {formatWebhooksCustomerError(
                          "We could not reach the destination.",
                          testResults[row.routingSubscriptionId]!.error,
                        )}
                      </p>
                    )}
                  </div>
                ) : null}
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
