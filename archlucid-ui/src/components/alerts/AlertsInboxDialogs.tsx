import Link from "next/link";
import { cn } from "@/lib/utils";

import type { AlertActionKind } from "@/components/alerts/AlertsInboxAlertCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import {
  alertsTriageDialogConfirmButtonLabelReaderRank,
  alertsTriageDialogReaderNote,
  alertsTriageDialogTitleReaderSuffix,
  enterpriseMutationControlDisabledTitle,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import type { AlertActionLoopDto } from "@/types/operate-rhythm";

type PendingActionState = {
  alertId: string;
  action: AlertActionKind;
};

export type AlertsInboxTriageActionDialogProps = {
  readonly pendingAction: PendingActionState | null;
  readonly actionComment: string;
  readonly actionBusy: boolean;
  readonly canMutateAlertInbox: boolean;
  readonly onActionCommentChange: (value: string) => void;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
};

export function AlertsInboxTriageActionDialog(props: AlertsInboxTriageActionDialogProps) {
  const mutationDisabledHintId = "alerts-inbox-triage-mutate-disabled-hint";
  const mutationDisabledReason = props.canMutateAlertInbox ? null : whyDisabledEnterpriseMutationControl();

  return (
    <Dialog
      open={props.pendingAction !== null}
      onOpenChange={(open) => {
        if (!open) {
          props.onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {props.pendingAction === null
              ? "Alert action"
              : `${props.pendingAction.action} alert${!props.canMutateAlertInbox ? alertsTriageDialogTitleReaderSuffix : ""}`}
          </DialogTitle>
          <DialogDescription>
            {props.pendingAction === null
              ? ""
              : `Optional comment is sent with the ${props.pendingAction.action} request for alert ${props.pendingAction.alertId}.`}
            {props.pendingAction !== null && !props.canMutateAlertInbox ? (
              <span className={cn("mt-2 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {alertsTriageDialogReaderNote}
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label htmlFor="alert-action-comment">Comment (optional)</Label>
          <Textarea
            id="alert-action-comment"
            rows={3}
            value={props.actionComment}
            onChange={(e) => {
              props.onActionCommentChange(e.target.value);
            }}
            placeholder="Context for auditors (optional)"
            readOnly={!props.canMutateAlertInbox}
            title={props.canMutateAlertInbox ? undefined : enterpriseMutationControlDisabledTitle}
          />
        </div>
        <DialogFooter>
          <WhyDisabledCtaHint
            id={mutationDisabledHintId}
            reason={mutationDisabledReason}
            testId={mutationDisabledHintId}
            className="w-full sm:mr-auto"
          />
          <Button type="button" variant="outline" onClick={props.onClose} disabled={props.actionBusy}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={props.onConfirm}
            disabled={props.actionBusy || props.pendingAction === null || !props.canMutateAlertInbox}
            aria-describedby={
              mutationDisabledReason === null ? undefined : mutationDisabledHintId
            }
          >
            {props.actionBusy
              ? "Saving…"
              : props.canMutateAlertInbox
                ? "Confirm"
                : alertsTriageDialogConfirmButtonLabelReaderRank}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type AlertsInboxActionLoopDialogProps = {
  readonly actionLoopAlertId: string | null;
  readonly actionLoopFindingHref: string | null;
  readonly actionLoopData: AlertActionLoopDto | null;
  readonly actionLoopLoading: boolean;
  readonly actionLoopError: string | null;
  readonly onClose: () => void;
};

export type AlertsInboxDialogsProps = {
  readonly triage: AlertsInboxTriageActionDialogProps;
  readonly actionLoop: AlertsInboxActionLoopDialogProps;
};

/** Combined triage + action-loop dialogs for a single deferred chunk import. */
export function AlertsInboxDialogs(props: AlertsInboxDialogsProps): React.JSX.Element {
  return (
    <>
      <AlertsInboxTriageActionDialog {...props.triage} />
      <AlertsInboxActionLoopDialog {...props.actionLoop} />
    </>
  );
}

export function AlertsInboxActionLoopDialog(props: AlertsInboxActionLoopDialogProps) {
  return (
    <Dialog
      open={props.actionLoopAlertId !== null}
      onOpenChange={(open) => {
        if (!open) {
          props.onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Routing &amp; delivery</DialogTitle>
          <DialogDescription>
            {props.actionLoopAlertId === null
              ? ""
              : `Alert ${props.actionLoopAlertId} — destinations are redacted; use this to confirm channels attempted.`}
          </DialogDescription>
        </DialogHeader>
        {props.actionLoopLoading ? (
          <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>
        ) : null}
        {props.actionLoopError !== null ? (
          <p className={cn("text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.body)} role="alert">
            {props.actionLoopError}
          </p>
        ) : null}
        {props.actionLoopData !== null ? (
          <div className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body)}>
            <p className="m-0">
              Status: <strong>{props.actionLoopData.status}</strong>
              {props.actionLoopData.runId ? (
                <>
                  {" "}
                  · Review:{" "}
                  <Link
                    className={OPERATOR_LINK.nav}
                    href={
                      props.actionLoopFindingHref ??
                      `/architecture/reviews/${encodeURIComponent(props.actionLoopData.runId)}`
                    }
                  >
                    {props.actionLoopFindingHref !== null ? "Open linked finding" : props.actionLoopData.runId}
                  </Link>
                </>
              ) : null}
            </p>
            {props.actionLoopData.resolutionComment ? (
              <p className="m-0 text-neutral-600 dark:text-neutral-400">
                Comment: {props.actionLoopData.resolutionComment}
              </p>
            ) : null}
            {props.actionLoopData.deliveryAttempts.length === 0 ? (
              <p className="m-0 text-neutral-600 dark:text-neutral-400">No delivery attempts recorded for this alert.</p>
            ) : (
              <ul className="m-0 list-none space-y-2 p-0">
                {props.actionLoopData.deliveryAttempts.map((attempt, idx) => (
                  <li
                    key={`${attempt.attemptedUtc}-${attempt.channelType}-${idx}`}
                    className="rounded border border-neutral-200 p-2 dark:border-neutral-700"
                  >
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                      {attempt.channelType} · {attempt.status}
                    </div>
                    <div className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                      {attempt.attemptedUtc}
                    </div>
                    <div className={OPERATOR_TYPOGRAPHY.helper}>Destination: {attempt.destinationRedacted}</div>
                    {attempt.errorMessage ? (
                      <div className={cn("text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)}>
                        {attempt.errorMessage}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={props.onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
