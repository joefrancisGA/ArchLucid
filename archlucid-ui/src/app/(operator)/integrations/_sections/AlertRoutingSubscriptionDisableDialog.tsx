"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  resolveAlertRoutingSubscriptionDisableDialogDescription,
  resolveAlertRoutingSubscriptionDisableDialogTitle,
  type AlertRoutingSubscriptionDisableChannel,
} from "@/lib/alert-routing-subscription-disable-copy";
import { cn } from "@/lib/utils";

export type AlertRoutingSubscriptionDisableTarget = {
  readonly routingSubscriptionId: string;
  readonly subscriptionName: string;
  readonly channel: AlertRoutingSubscriptionDisableChannel;
};

type AlertRoutingSubscriptionDisableDialogProps = {
  readonly target: AlertRoutingSubscriptionDisableTarget | null;
  readonly busy: boolean;
  readonly errorMessage?: string | null;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

/** Domain wrapper over {@link ConfirmationDialog} for alert-routing disable confirms (TB-2363). */
export function AlertRoutingSubscriptionDisableDialog(
  props: AlertRoutingSubscriptionDisableDialogProps,
): React.JSX.Element {
  const channel = props.target?.channel ?? "webhook";
  const subscriptionName = props.target?.subscriptionName ?? "";
  const errorMessage = props.errorMessage ?? null;

  return (
    <ConfirmationDialog
      open={props.target !== null}
      onOpenChange={(open) => {
        if (!open && !props.busy) {
          props.onCancel();
        }
      }}
      title={resolveAlertRoutingSubscriptionDisableDialogTitle(channel, subscriptionName)}
      description={resolveAlertRoutingSubscriptionDisableDialogDescription(channel)}
      confirmLabel="Disable"
      variant="destructive"
      busy={props.busy}
      onConfirm={props.onConfirm}
      extraContent={
        errorMessage !== null ? (
          <p
            className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")}
            role="alert"
            data-testid="alert-routing-subscription-disable-error"
          >
            {errorMessage}
          </p>
        ) : null
      }
    />
  );
}
