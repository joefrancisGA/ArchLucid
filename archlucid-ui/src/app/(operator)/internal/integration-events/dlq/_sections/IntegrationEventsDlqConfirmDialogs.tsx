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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INTEGRATION_EVENTS_DLQ_BULK_RETRY_ACKNOWLEDGMENT } from "@/lib/integration-events-dlq-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type IntegrationEventsDlqBulkRetryConfirmDialogProps = {
  readonly open: boolean;
  readonly busy: boolean;
  readonly filteredRowCount: number;
  readonly acknowledgment: string;
  readonly onAcknowledgmentChange: (value: string) => void;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

export function IntegrationEventsDlqBulkRetryConfirmDialog(
  props: IntegrationEventsDlqBulkRetryConfirmDialogProps,
): React.JSX.Element {
  const acknowledgmentMatches =
    props.acknowledgment.trim().toLowerCase() === INTEGRATION_EVENTS_DLQ_BULK_RETRY_ACKNOWLEDGMENT;

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) {
          props.onCancel();
        }
      }}
    >
      <DialogContent data-testid="integration-events-dlq-bulk-retry-confirm-dialog">
        <DialogHeader>
          <DialogTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>Bulk retry failed messages?</DialogTitle>
          <DialogDescription className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
            This queues up to 100 dead-letter rows across every tenant and event type — not your current workspace
            only. Fix the root cause before bulk retry.
            {props.filteredRowCount > 0 ? (
              <>
                {" "}
                The table currently shows {props.filteredRowCount} matching row
                {props.filteredRowCount === 1 ? "" : "s"} after filters.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="integration-events-dlq-bulk-retry-acknowledgment" className={OPERATOR_TYPOGRAPHY.label}>
            Type <span className="font-mono">{INTEGRATION_EVENTS_DLQ_BULK_RETRY_ACKNOWLEDGMENT}</span> to confirm
          </Label>
          <Input
            id="integration-events-dlq-bulk-retry-acknowledgment"
            value={props.acknowledgment}
            autoComplete="off"
            disabled={props.busy}
            data-testid="integration-events-dlq-bulk-retry-acknowledgment-input"
            onChange={(event) => {
              props.onAcknowledgmentChange(event.target.value);
            }}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={props.busy} onClick={props.onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={props.busy || !acknowledgmentMatches}
            data-testid="integration-events-dlq-bulk-retry-confirm-button"
            onClick={props.onConfirm}
          >
            {props.busy ? "Bulk retrying…" : "Bulk retry (100)"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type IntegrationEventsDlqSuppressConfirmDialogProps = {
  readonly open: boolean;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

export function IntegrationEventsDlqSuppressConfirmDialog(
  props: IntegrationEventsDlqSuppressConfirmDialogProps,
): React.JSX.Element {
  return (
    <AlertDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) {
          props.onCancel();
        }
      }}
    >
      <AlertDialogContent data-testid="integration-events-dlq-suppress-confirm-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>Suppress this message?</AlertDialogTitle>
          <AlertDialogDescription className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
            Suppress marks the row processed without republishing. Use when the event should not be retried.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={props.busy}
            data-testid="integration-events-dlq-suppress-confirm-button"
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={(event) => {
              event.preventDefault();
              props.onConfirm();
            }}
          >
            {props.busy ? "Suppressing…" : "Suppress"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
