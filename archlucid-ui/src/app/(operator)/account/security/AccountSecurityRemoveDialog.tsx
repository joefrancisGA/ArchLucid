"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import type { SignInMethodSummary } from "@/lib/sign-in-methods-api";

export const ACCOUNT_SECURITY_REMOVE_WARNING =
  "Removing a sign-in method cannot be undone. You must keep at least one way to sign in. Organization SSO requirements may block removal of your last enterprise method.";

type AccountSecurityRemoveDialogProps = {
  readonly method: SignInMethodSummary | null;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

function methodLabel(method: SignInMethodSummary): string {
  if (method.maskedIdentifier) {
    return `${method.providerLabel} (${method.maskedIdentifier})`;
  }

  return method.providerLabel;
}

/** Domain wrapper over {@link ConfirmationDialog} for sign-in method removal (TB-2366). */
export function AccountSecurityRemoveDialog(props: AccountSecurityRemoveDialogProps): React.JSX.Element {
  const title = props.method ? `Remove ${methodLabel(props.method)}?` : "Remove sign-in method?";

  return (
    <ConfirmationDialog
      open={props.method !== null}
      onOpenChange={(open) => {
        if (!open && !props.busy) {
          props.onCancel();
        }
      }}
      title={title}
      description={ACCOUNT_SECURITY_REMOVE_WARNING}
      confirmLabel="Remove"
      variant="destructive"
      busy={props.busy}
      onConfirm={props.onConfirm}
    />
  );
}
