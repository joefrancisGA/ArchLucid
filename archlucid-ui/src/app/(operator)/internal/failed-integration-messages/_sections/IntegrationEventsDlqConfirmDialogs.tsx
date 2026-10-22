"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INTEGRATION_EVENTS_DLQ_BULK_RETRY_ACKNOWLEDGMENT } from "@/lib/integration-events-dlq-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function buildBulkRetryDescription(filteredRowCount: number): string {
  const base =
    "This queues up to 100 dead-letter rows across every tenant and event type — not your current workspace only. Fix the root cause before bulk retry.";

  if (filteredRowCount <= 0) {
    return base;
  }

  const rowWord = filteredRowCount === 1 ? "row" : "rows";

  return `${base} The table currently shows ${filteredRowCount} matching ${rowWord} after filters.`;
}

type IntegrationEventsDlqBulkRetryConfirmDialogProps = {
  readonly open: boolean;
  readonly busy: boolean;
  readonly filteredRowCount: number;
  readonly acknowledgment: string;
  readonly onAcknowledgmentChange: (value: string) => void;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

/** Domain wrapper over {@link ConfirmationDialog} for DLQ bulk retry (TB-2370). */
export function IntegrationEventsDlqBulkRetryConfirmDialog(
  props: IntegrationEventsDlqBulkRetryConfirmDialogProps,
): React.JSX.Element {
  const acknowledgmentMatches =
    props.acknowledgment.trim().toLowerCase() === INTEGRATION_EVENTS_DLQ_BULK_RETRY_ACKNOWLEDGMENT;

  return (
    <ConfirmationDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open && !props.busy) {
          props.onCancel();
        }
      }}
      title="Bulk retry failed messages?"
      description={buildBulkRetryDescription(props.filteredRowCount)}
      confirmLabel="Bulk retry (100)"
      variant="destructive"
      busy={props.busy}
      confirmDisabled={!acknowledgmentMatches}
      onConfirm={props.onConfirm}
      extraContent={
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
      }
    />
  );
}

type IntegrationEventsDlqSuppressConfirmDialogProps = {
  readonly open: boolean;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

/** Domain wrapper over {@link ConfirmationDialog} for DLQ suppress (TB-2370). */
export function IntegrationEventsDlqSuppressConfirmDialog(
  props: IntegrationEventsDlqSuppressConfirmDialogProps,
): React.JSX.Element {
  return (
    <ConfirmationDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open && !props.busy) {
          props.onCancel();
        }
      }}
      title="Suppress this message?"
      description="Suppress marks the row processed without republishing. Use when the event should not be retried."
      confirmLabel="Suppress"
      variant="destructive"
      busy={props.busy}
      onConfirm={props.onConfirm}
    />
  );
}
