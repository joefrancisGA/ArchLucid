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
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AwsConnectionDisconnectTarget = {
  readonly connectionId: string;
  readonly accountId: string;
};

type AwsConnectionDisconnectDialogProps = {
  readonly target: AwsConnectionDisconnectTarget | null;
  readonly busy: boolean;
  readonly errorMessage?: string | null;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

export function AwsConnectionDisconnectDialog(props: AwsConnectionDisconnectDialogProps): React.JSX.Element {
  const accountId = props.target?.accountId ?? "";
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
      <AlertDialogContent data-testid="aws-connection-disconnect-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {accountId.length > 0 ? `Disconnect AWS account ${accountId}?` : "Disconnect AWS account?"}
          </AlertDialogTitle>
          <AlertDialogDescription className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
            Scheduled read-only inventory collection for this AWS account will stop. Previously collected inventory
            packages and any signed review records that cite them are retained.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage !== null ? (
          <p
            className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")}
            role="alert"
            data-testid="aws-connection-disconnect-error"
          >
            {errorMessage}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.busy} data-testid="aws-connection-disconnect-cancel">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={props.busy}
            data-testid="aws-connection-disconnect-confirm"
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={(event) => {
              event.preventDefault();
              props.onConfirm();
            }}
          >
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
