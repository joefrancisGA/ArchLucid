"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import {
  IDENTITY_PROVIDERS_ACTION_SAVE,
  IDENTITY_PROVIDERS_SAVE_CONFIRM_DESCRIPTION,
  IDENTITY_PROVIDERS_SAVE_CONFIRM_TITLE,
} from "@/lib/identity-providers-settings-copy";

type IdentityProvidersSaveConfirmDialogProps = {
  readonly open: boolean;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

/** Domain wrapper over {@link ConfirmationDialog} for identity provider save confirms (TB-2369). */
export function IdentityProvidersSaveConfirmDialog(
  props: IdentityProvidersSaveConfirmDialogProps,
): React.JSX.Element {
  return (
    <ConfirmationDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open && !props.busy) {
          props.onCancel();
        }
      }}
      title={IDENTITY_PROVIDERS_SAVE_CONFIRM_TITLE}
      description={IDENTITY_PROVIDERS_SAVE_CONFIRM_DESCRIPTION}
      confirmLabel={IDENTITY_PROVIDERS_ACTION_SAVE}
      variant="default"
      busy={props.busy}
      onConfirm={props.onConfirm}
    />
  );
}
