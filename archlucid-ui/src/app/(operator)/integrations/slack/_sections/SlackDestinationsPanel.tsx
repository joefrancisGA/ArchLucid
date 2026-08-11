"use client";

import { RefreshCw } from "lucide-react";

import { BooleanStatusChip } from "@/components/ui/boolean-status-chip";
import { Button } from "@/components/ui/button";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { formatRelativeTime } from "@/lib/relative-time";
import { labelForSlackIntegrationEventId } from "@/lib/slack-integration-form-schema";
import {
  SLACK_INTEGRATION_DESTINATIONS_TITLE,
  SLACK_INTEGRATION_EMPTY_DESCRIPTION,
  SLACK_INTEGRATION_EMPTY_TITLE,
  slackIntegrationDestinationsSupportingText,
} from "@/lib/slack-integration-page-copy";
import { summarizeMaskedWebhookSubscription } from "@/lib/webhook-subscription-metadata";
import { cn } from "@/lib/utils";
import type { AlertRoutingSubscription } from "@/types/alert-routing";
import type { SlackIntegrationTestFeedback } from "@/lib/slack-integration-test-feedback";

type SlackDestinationsPanelProps = {
  readonly destinations: readonly AlertRoutingSubscription[];
  readonly loading: boolean;
  readonly canMutate: boolean;
  readonly testingId: string | null;
  readonly rowTestFeedback: Readonly<Record<string, SlackIntegrationTestFeedback>>;
  readonly onRefresh: () => void;
  readonly onTest: (routingSubscriptionId: string) => void;
  readonly onToggle: (routingSubscriptionId: string, isEnabled: boolean, subscriptionName: string) => void;
};

function formatLastDeliveryLabel(lastDeliveredUtc: string | null | undefined): string {
  const trimmed = lastDeliveredUtc?.trim() ?? "";

  if (trimmed.length === 0) {
    return "Not yet delivered";
  }

  const parsed = Date.parse(trimmed);

  if (Number.isNaN(parsed)) {
    return "Not yet delivered";
  }

  return formatRelativeTime(trimmed);
}

/** Lists configured Slack webhook destinations for the current workspace. */
export function SlackDestinationsPanel(props: SlackDestinationsPanelProps): React.ReactElement {
  const {
    destinations,
    loading,
    canMutate,
    testingId,
    rowTestFeedback,
    onRefresh,
    onTest,
    onToggle,
  } = props;

  return (
    <section aria-labelledby="slack-destinations-heading" className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="slack-destinations-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {SLACK_INTEGRATION_DESTINATIONS_TITLE}
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {slackIntegrationDestinationsSupportingText(destinations.length)}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 px-2"
          onClick={onRefresh}
          disabled={loading}
          aria-label={loading ? "Refreshing destinations" : "Refresh destinations"}
          data-testid="slack-destinations-refresh"
        >
          <RefreshCw className={cn("h-4 w-4", loading ? "animate-spin" : "")} aria-hidden />
        </Button>
      </div>

      {destinations.length === 0 ? (
        <EnterpriseCompactEmptyState
          title={SLACK_INTEGRATION_EMPTY_TITLE}
          description={SLACK_INTEGRATION_EMPTY_DESCRIPTION}
          testId="slack-destinations-empty-state"
        />
      ) : (
        <div className={cn("overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body)}>
          <table className="w-full min-w-[40rem] border-collapse text-left" data-testid="slack-destinations-table">
            <caption className="sr-only">Slack notification destinations</caption>
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60">
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Destination name
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Minimum severity
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Events
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Last successful delivery
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {destinations.map((row) => {
                const masked = summarizeMaskedWebhookSubscription(row.metadataJson);
                const friendlyEventLabels = masked.eventTypes.map((eventId) => labelForSlackIntegrationEventId(eventId));
                const feedback = rowTestFeedback[row.routingSubscriptionId];

                return (
                  <tr
                    key={row.routingSubscriptionId}
                    className="border-b border-neutral-200 last:border-b-0 dark:border-neutral-800"
                  >
                    <th scope="row" className="px-3 py-3 align-top font-medium text-al-text-primary">
                      {row.name}
                    </th>
                    <td className="px-3 py-3 align-top">{row.minimumSeverity}</td>
                    <td className="px-3 py-3 align-top">
                      {friendlyEventLabels.length > 0 ? friendlyEventLabels.join(", ") : "—"}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <BooleanStatusChip value={row.isEnabled === true} trueLabel="Enabled" falseLabel="Disabled" />
                    </td>
                    <td className="px-3 py-3 align-top text-al-text-secondary">
                      {formatLastDeliveryLabel(row.lastDeliveredUtc)}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={testingId !== null}
                          onClick={() => onTest(row.routingSubscriptionId)}
                        >
                          {testingId === row.routingSubscriptionId ? "Sending…" : "Send test"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!canMutate || loading}
                          title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                          onClick={() => onToggle(row.routingSubscriptionId, row.isEnabled === true, row.name)}
                          data-testid={`slack-toggle-${row.routingSubscriptionId}`}
                        >
                          {row.isEnabled === true ? "Disable" : "Enable"}
                        </Button>
                      </div>
                      {feedback !== undefined ? (
                        <p
                          role={feedback.kind === "error" ? "alert" : "status"}
                          className={cn(
                            "m-0 mt-2",
                            OPERATOR_TYPOGRAPHY.helper,
                            feedback.kind === "error" ? "text-red-700 dark:text-red-300" : "text-teal-800 dark:text-teal-200",
                          )}
                        >
                          {feedback.message}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
