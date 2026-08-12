"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import type { ReactElement } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorInventoryRowMoreActions } from "@/components/operator/OperatorInventoryRowMoreActions";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { formatDigestInstant } from "@/lib/digest-setup-gap-actions";
import {
  channelDisplayLabel,
  formatDeliveryResult,
  resolveSubscriptionStatusBadge,
} from "@/lib/digest-subscription-form";
import {
  DIGEST_SUBSCRIPTIONS_SEND_TEST_HREF,
  maskDigestDestination,
} from "@/lib/digest-subscriptions-workflow";
import {
  DIGESTS_BROWSE_SEND_TEST_LABEL,
  DIGESTS_BROWSE_SEND_TEST_TITLE,
} from "@/lib/digests-browse-copy";
import {
  digestSubscriptionsDeliveryAttemptsButtonLabelReaderRank,
  digestSubscriptionsDeliveryAttemptsButtonTitleOperator,
  digestSubscriptionsDeliveryAttemptsButtonTitleReader,
  digestSubscriptionsToggleToDisabledReaderRank,
  digestSubscriptionsToggleToEnabledReaderRank,
  digestSubscriptionsYourSubscriptionsHeadingOperator,
  digestSubscriptionsYourSubscriptionsHeadingReader,
} from "@/lib/enterprise-controls-context-copy";
import { reversibleControlLabel } from "@/lib/reversible-control-verbs";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import type { DigestDeliveryAttempt, DigestSubscription } from "@/types/digest-subscriptions";

export type DigestSubscriptionListProps = {
  readonly items: readonly DigestSubscription[];
  readonly attemptsBySub: Readonly<Record<string, DigestDeliveryAttempt[]>>;
  readonly historyOpenFor: string | null;
  readonly loading: boolean;
  readonly canMutate: boolean;
  readonly canRevealDestinations: boolean;
  readonly onRefresh: () => void;
  readonly onToggle: (subscriptionId: string, isEnabled: boolean, subscriptionName: string) => void;
  readonly onViewHistory: (subscriptionId: string) => void;
  readonly onPrefillCreate: (subscription: DigestSubscription) => void;
};

export function DigestSubscriptionList(props: DigestSubscriptionListProps): ReactElement {
  const heading: string = props.canMutate
    ? digestSubscriptionsYourSubscriptionsHeadingOperator
    : digestSubscriptionsYourSubscriptionsHeadingReader;
  const mutationDisabledReason = props.canMutate ? null : whyDisabledEnterpriseMutationControl();
  const mutationDisabledHintId = "digest-subscriptions-mutate-disabled-hint";

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{heading}</h3>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={props.onRefresh}
          disabled={props.loading}
          data-testid="digest-subscriptions-refresh"
        >
          {props.loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <WhyDisabledCtaHint
        id={mutationDisabledHintId}
        reason={mutationDisabledReason}
        testId="digest-subscriptions-mutate-disabled-hint"
        className="mt-2"
      />

      {!props.loading && props.items.length === 0 ? (
        <div className="mt-3" data-testid="digest-subscriptions-empty-state">
          <EnterpriseCompactEmptyState
            testId="digest-subscriptions-empty"
            title="No delivery destinations yet"
            description="Save a subscription below to deliver architecture digests to email or a Teams/Slack webhook."
            actions={[]}
          />
        </div>
      ) : null}

      {props.items.length > 0 ? (
        <div className="mt-3 space-y-3">
          <EnterpriseTable ariaLabel="Digest subscriptions">
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Channel</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Destination</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Last delivery</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Delivery result</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {props.items.map((item) => {
                const attempts: DigestDeliveryAttempt[] = props.attemptsBySub[item.subscriptionId] ?? [];
                const status = resolveSubscriptionStatusBadge(item, attempts);

                return (
                  <EnterpriseTableRow key={item.subscriptionId}>
                    <EnterpriseTableCell>
                      <span className={OPERATOR_TYPOGRAPHY.body}>{item.name}</span>
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <span className={OPERATOR_TYPOGRAPHY.helper}>{channelDisplayLabel(item.channelType)}</span>
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <span className={cn("break-all", OPERATOR_TYPOGRAPHY.helper)}>
                        {maskDigestDestination(item.destination, props.canRevealDestinations)}
                      </span>
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <StatusTag kind={status.kind} label={status.label} />
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <span className={OPERATOR_TYPOGRAPHY.helper}>
                        {formatDigestInstant(item.lastDeliveredUtc)}
                      </span>
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <span className={OPERATOR_TYPOGRAPHY.helper}>{formatDeliveryResult(attempts)}</span>
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <OperatorInventoryRowMoreActions
                        testId={`digest-subscription-more-${item.subscriptionId}`}
                        primaryActions={
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              props.onToggle(item.subscriptionId, item.isEnabled === true, item.name)
                            }
                            disabled={!props.canMutate}
                            aria-describedby={
                              mutationDisabledReason === null ? undefined : mutationDisabledHintId
                            }
                            data-testid={`digest-subscription-toggle-${item.subscriptionId}`}
                          >
                            {props.canMutate
                              ? reversibleControlLabel("recurring-activity", item.isEnabled === true)
                              : item.isEnabled
                                ? digestSubscriptionsToggleToDisabledReaderRank
                                : digestSubscriptionsToggleToEnabledReaderRank}
                          </Button>
                        }
                        overflowActions={
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={!props.canMutate}
                              aria-describedby={
                                mutationDisabledReason === null ? undefined : mutationDisabledHintId
                              }
                              onClick={() => props.onPrefillCreate(item)}
                            >
                              Edit
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link href={DIGEST_SUBSCRIPTIONS_SEND_TEST_HREF} title={DIGESTS_BROWSE_SEND_TEST_TITLE}>
                                {DIGESTS_BROWSE_SEND_TEST_LABEL}
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => props.onViewHistory(item.subscriptionId)}
                              title={
                                props.canMutate
                                  ? digestSubscriptionsDeliveryAttemptsButtonTitleOperator
                                  : digestSubscriptionsDeliveryAttemptsButtonTitleReader
                              }
                            >
                              {props.historyOpenFor === item.subscriptionId
                                ? "Hide delivery history"
                                : props.canMutate
                                  ? "View delivery history"
                                  : digestSubscriptionsDeliveryAttemptsButtonLabelReaderRank}
                            </Button>
                          </>
                        }
                      />
                    </EnterpriseTableCell>
                  </EnterpriseTableRow>
                );
              })}
            </EnterpriseTableBody>
          </EnterpriseTable>

          {props.historyOpenFor !== null && (props.attemptsBySub[props.historyOpenFor]?.length ?? 0) > 0 ? (
            <div
              className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
              data-testid="digest-subscription-delivery-history"
            >
              <h4 className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                Delivery history
              </h4>
              <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
                {(props.attemptsBySub[props.historyOpenFor] ?? []).map((attempt) => (
                  <li key={attempt.attemptId}>
                    {attempt.status} · {formatDigestInstant(attempt.attemptedUtc)}
                    {attempt.errorMessage ? (
                      <span className="text-rose-700 dark:text-rose-300"> — {attempt.errorMessage}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {props.historyOpenFor !== null && (props.attemptsBySub[props.historyOpenFor]?.length ?? 0) === 0 ? (
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              No delivery attempts recorded for this subscription yet.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
