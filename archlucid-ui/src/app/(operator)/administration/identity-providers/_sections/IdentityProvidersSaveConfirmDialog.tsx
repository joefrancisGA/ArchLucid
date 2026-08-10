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
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  IDENTITY_PROVIDERS_ACTION_SAVE,
  IDENTITY_PROVIDERS_SAVE_CONFIRM_DESCRIPTION,
  IDENTITY_PROVIDERS_SAVE_CONFIRM_TITLE,
} from "@/lib/identity-providers-settings-copy";
import { cn } from "@/lib/utils";

type IdentityProvidersSaveConfirmDialogProps = {
  readonly open: boolean;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

export function IdentityProvidersSaveConfirmDialog(
  props: IdentityProvidersSaveConfirmDialogProps,
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
      <AlertDialogContent data-testid="identity-providers-save-confirm-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {IDENTITY_PROVIDERS_SAVE_CONFIRM_TITLE}
          </AlertDialogTitle>
          <AlertDialogDescription className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
            {IDENTITY_PROVIDERS_SAVE_CONFIRM_DESCRIPTION}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.busy} data-testid="identity-providers-save-confirm-cancel">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={props.busy}
            data-testid="identity-providers-save-confirm-confirm"
            onClick={(event) => {
              event.preventDefault();
              props.onConfirm();
            }}
          >
            {props.busy ? "Saving…" : IDENTITY_PROVIDERS_ACTION_SAVE}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
