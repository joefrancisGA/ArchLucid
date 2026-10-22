"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import {
  SCIM_CREATE_DIALOG_CANCEL,
  SCIM_CREATE_DIALOG_CONFIRM,
  SCIM_CREATE_DIALOG_DESCRIPTION,
  SCIM_CREATE_DIALOG_TITLE,
} from "@/lib/scim-provisioning-page-copy";

type ScimProvisioningCreateConfirmDialogProps = {
  readonly open: boolean;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

/** Domain wrapper over {@link ConfirmationDialog} for SCIM token creation. */
export function ScimProvisioningCreateConfirmDialog(
  props: ScimProvisioningCreateConfirmDialogProps,
): React.JSX.Element {
  return (
    <ConfirmationDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open && !props.busy) {
          props.onCancel();
        }
      }}
      title={SCIM_CREATE_DIALOG_TITLE}
      description={SCIM_CREATE_DIALOG_DESCRIPTION}
      confirmLabel={SCIM_CREATE_DIALOG_CONFIRM}
      cancelLabel={SCIM_CREATE_DIALOG_CANCEL}
      variant="default"
      busy={props.busy}
      onConfirm={props.onConfirm}
    />
  );
}
