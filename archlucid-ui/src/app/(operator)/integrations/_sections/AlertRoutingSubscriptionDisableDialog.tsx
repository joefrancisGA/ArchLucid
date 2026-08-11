"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  resolveAlertRoutingSubscriptionDisableDialogDescription,
  resolveAlertRoutingSubscriptionDisableDialogTitle,
  type AlertRoutingSubscriptionDisableChannel,
} from "@/lib/alert-routing-subscription-disable-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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

export function AlertRoutingSubscriptionDisableDialog(
  props: AlertRoutingSubscriptionDisableDialogProps,
): React.JSX.Element {
  const channel = props.target?.channel ?? "webhook";
  const subscriptionName = props.target?.subscriptionName ?? "";
  const errorMessage = props.errorMessage ?? null;

  return (
    <AlertDialog
      open={props.target !== null}
      onOpenChange={(open) => {
        if (!open) {
          props.onCancel();
        }
      }}
    >
      <AlertDialogContent data-testid="alert-routing-subscription-disable-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {resolveAlertRoutingSubscriptionDisableDialogTitle(channel, subscriptionName)}
          </AlertDialogTitle>
          <AlertDialogDescription className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
            {resolveAlertRoutingSubscriptionDisableDialogDescription(channel)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage !== null ? (
          <p
            className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")}
            role="alert"
            data-testid="alert-routing-subscription-disable-error"
          >
            {errorMessage}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.busy} data-testid="alert-routing-subscription-disable-cancel">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={props.busy}
            data-testid="alert-routing-subscription-disable-confirm"
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={(event) => {
              event.preventDefault();
              props.onConfirm();
            }}
          >
            Disable
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
