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
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_CROSS_SUBSCRIPTION_DIFF_DIALOG_CANCEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_CROSS_SUBSCRIPTION_DIFF_DIALOG_CONFIRM,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_CROSS_SUBSCRIPTION_DIFF_DIALOG_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";

export type DriftCrossSubscriptionDiffConfirmDialogProps = {
  readonly open: boolean;
  readonly description: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
};

export function DriftCrossSubscriptionDiffConfirmDialog(
  props: DriftCrossSubscriptionDiffConfirmDialogProps,
): React.JSX.Element {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent data-testid="infra-drift-cross-subscription-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{GOVERNANCE_INFRASTRUCTURE_DRIFT_CROSS_SUBSCRIPTION_DIFF_DIALOG_TITLE}</AlertDialogTitle>
          <AlertDialogDescription>{props.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="infra-drift-cross-subscription-cancel">
            {GOVERNANCE_INFRASTRUCTURE_DRIFT_CROSS_SUBSCRIPTION_DIFF_DIALOG_CANCEL}
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid="infra-drift-cross-subscription-confirm"
            onClick={() => {
              props.onConfirm();
            }}
          >
            {GOVERNANCE_INFRASTRUCTURE_DRIFT_CROSS_SUBSCRIPTION_DIFF_DIALOG_CONFIRM}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
