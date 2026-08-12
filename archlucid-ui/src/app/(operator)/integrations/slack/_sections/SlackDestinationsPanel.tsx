"use client";

import { RefreshCw } from "lucide-react";

import { BooleanStatusChip } from "@/components/ui/boolean-status-chip";
import { Button } from "@/components/ui/button";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { labelForSlackIntegrationEventId } from "@/lib/slack-integration-form-schema";
import {
  SLACK_DESTINATIONS_REFRESH_LABEL,
  SLACK_DESTINATIONS_REFRESHING_LABEL,
  SLACK_INTEGRATION_DESTINATIONS_TITLE,
  SLACK_INTEGRATION_EMPTY_DESCRIPTION,
  SLACK_INTEGRATION_EMPTY_TITLE,
  slackIntegrationDestinationsSupportingText,
} from "@/lib/slack-integration-page-copy";
import type { SlackIntegrationTestFeedback } from "@/lib/slack-integration-test-feedback";
import {
  formatWebhookSubscriptionLastDeliveryLabel,
  summarizeMaskedWebhookSubscription,
} from "@/lib/webhook-subscription-metadata";
import { cn } from "@/lib/utils";
import type { AlertRoutingSubscription } from "@/types/alert-routing";

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
          {destinations.length > 0 ? (
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {slackIntegrationDestinationsSupportingText(destinations.length)}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-2"
          onClick={onRefresh}
          disabled={loading}
          data-testid="slack-destinations-refresh"
        >
          <RefreshCw className={cn("h-4 w-4", loading ? "animate-spin" : "")} aria-hidden />
          {loading ? SLACK_DESTINATIONS_REFRESHING_LABEL : SLACK_DESTINATIONS_REFRESH_LABEL}
        </Button>
      </div>

      {destinations.length === 0 ? (
        <EnterpriseCompactEmptyState
          title={SLACK_INTEGRATION_EMPTY_TITLE}
          description={SLACK_INTEGRATION_EMPTY_DESCRIPTION}
          testId="slack-destinations-empty-state"
        />
      ) : (
        <EnterpriseTable ariaLabel="Slack notification destinations" data-testid="slack-destinations-table">
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell>Destination name</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Minimum severity</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Events</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Last successful delivery</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {destinations.map((row) => {
              const masked = summarizeMaskedWebhookSubscription(row.metadataJson);
              const friendlyEventLabels = masked.eventTypes.map((eventId) => labelForSlackIntegrationEventId(eventId));
              const feedback = rowTestFeedback[row.routingSubscriptionId];

              return (
                <EnterpriseTableRow key={row.routingSubscriptionId}>
                  <EnterpriseTableCell>
                    <span className="font-medium text-al-text-primary">{row.name}</span>
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <span className={OPERATOR_TYPOGRAPHY.helper}>{row.minimumSeverity}</span>
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <span className={OPERATOR_TYPOGRAPHY.helper}>
                      {friendlyEventLabels.length > 0 ? friendlyEventLabels.join(", ") : "—"}
                    </span>
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <BooleanStatusChip value={row.isEnabled === true} trueLabel="Enabled" falseLabel="Disabled" />
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {formatWebhookSubscriptionLastDeliveryLabel(row.lastDeliveredUtc)}
                    </span>
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>
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
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              );
            })}
          </EnterpriseTableBody>
        </EnterpriseTable>
      )}
    </section>
  );
}
