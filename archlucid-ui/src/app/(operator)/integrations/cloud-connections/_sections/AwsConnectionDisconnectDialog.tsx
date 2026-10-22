"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { OPERATOR_DANGER, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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

function resolveDisconnectTitle(accountId: string): string {
  if (accountId.length > 0) {
    return `Disconnect AWS account ${accountId}?`;
  }

  return "Disconnect AWS account?";
}

/** Domain wrapper over {@link ConfirmationDialog} for AWS disconnect (TB-2371). */
export function AwsConnectionDisconnectDialog(props: AwsConnectionDisconnectDialogProps): React.JSX.Element {
  const accountId = props.target?.accountId ?? "";
  const errorMessage = props.errorMessage ?? null;

  return (
    <ConfirmationDialog
      open={props.target !== null}
      onOpenChange={(open) => {
        if (!open && !props.busy) {
          props.onCancel();
        }
      }}
      title={resolveDisconnectTitle(accountId)}
      description="Scheduled read-only inventory collection for this AWS account will stop. Previously collected inventory packages and any finalized review records that cite them are retained."
      confirmLabel="Disconnect"
      variant="destructive"
      busy={props.busy}
      onConfirm={props.onConfirm}
      extraContent={
        errorMessage !== null ? (
          <p
            className={cn(OPERATOR_TYPOGRAPHY.body, OPERATOR_DANGER.text)}
            role="alert"
            data-testid="aws-connection-disconnect-error"
          >
            {errorMessage}
          </p>
        ) : null
      }
    />
  );
}
