"use client";

import { cn } from "@/lib/utils";

import { AlertRoutingContinueLastViewedRow } from "@/components/alerts/AlertRoutingContinueLastViewedRow";
import { AlertRoutingDestinationList } from "@/components/alerts/AlertRoutingDestinationList";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AlertRoutingContinueLastTarget } from "@/lib/resolve-continue-last-alert-routing-subscription";
import type { AlertRoutingDeliveryAttempt, AlertRoutingSubscription } from "@/types/alert-routing";

export type AlertRoutingSubscriptionsListProps = {
  readonly items: readonly AlertRoutingSubscription[];
  readonly attemptsBySub: Record<string, AlertRoutingDeliveryAttempt[]>;
  readonly canEditRouting: boolean;
  readonly testingId: string | null;
  readonly continueLastSubscription: AlertRoutingContinueLastTarget | null;
  readonly onAddDestination: () => void;
  readonly onToggle: (
    id: string,
    isEnabled: boolean,
    subscriptionName: string,
    channelTypeValue: string,
  ) => void;
  readonly onLoadAttempts: (id: string) => void;
  readonly onTest: (id: string) => void;
  readonly onOpenSubscription: (subscriptionId: string) => void;
};

export function AlertRoutingSubscriptionsList(props: AlertRoutingSubscriptionsListProps): React.JSX.Element {
  return (
    <section aria-labelledby="alert-routing-destinations-heading" className="space-y-4">
      <h3 id="alert-routing-destinations-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Notification destinations
      </h3>
      {props.continueLastSubscription !== null ? (
        <AlertRoutingContinueLastViewedRow
          target={props.continueLastSubscription}
          onOpen={props.onOpenSubscription}
        />
      ) : null}
      <AlertRoutingDestinationList
        items={props.items}
        attemptsBySub={props.attemptsBySub}
        canMutateRouting={props.canEditRouting}
        testingId={props.testingId}
        onAddDestination={props.onAddDestination}
        onToggle={(id, isEnabled, subscriptionName, channelTypeValue) =>
          props.onToggle(id, isEnabled, subscriptionName, channelTypeValue)
        }
        onLoadAttempts={(id) => props.onLoadAttempts(id)}
        onTest={(id) => props.onTest(id)}
      />
    </section>
  );
}
