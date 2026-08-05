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
import type { SignInMethodSummary } from "@/lib/sign-in-methods-api";
import { cn } from "@/lib/utils";

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

export function AccountSecurityRemoveDialog(props: AccountSecurityRemoveDialogProps): React.JSX.Element {
  return (
    <AlertDialog
      open={props.method !== null}
      onOpenChange={(open) => {
        if (!open) {
          props.onCancel();
        }
      }}
    >
      <AlertDialogContent data-testid="account-security-remove-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {props.method ? `Remove ${methodLabel(props.method)}?` : "Remove sign-in method?"}
          </AlertDialogTitle>
          <AlertDialogDescription className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
            {ACCOUNT_SECURITY_REMOVE_WARNING}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.busy} data-testid="account-security-remove-cancel">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={props.busy}
            data-testid="account-security-remove-confirm"
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={(event) => {
              event.preventDefault();
              props.onConfirm();
            }}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
