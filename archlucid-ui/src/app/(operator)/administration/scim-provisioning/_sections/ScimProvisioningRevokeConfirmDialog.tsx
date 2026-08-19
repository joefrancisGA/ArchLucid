"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import {
  SCIM_REVOKE_DIALOG_CONFIRM,
  SCIM_REVOKE_DIALOG_DESCRIPTION,
  SCIM_REVOKE_DIALOG_TITLE,
} from "@/lib/scim-provisioning-page-copy";

type ScimProvisioningRevokeConfirmDialogProps = {
  readonly open: boolean;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

/** Domain wrapper over {@link ConfirmationDialog} for SCIM token revoke (TB-2373). */
export function ScimProvisioningRevokeConfirmDialog(
  props: ScimProvisioningRevokeConfirmDialogProps,
): React.JSX.Element {
  return (
    <ConfirmationDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open && !props.busy) {
          props.onCancel();
        }
      }}
      title={SCIM_REVOKE_DIALOG_TITLE}
      description={SCIM_REVOKE_DIALOG_DESCRIPTION}
      confirmLabel={SCIM_REVOKE_DIALOG_CONFIRM}
      variant="destructive"
      busy={props.busy}
      onConfirm={props.onConfirm}
    />
  );
}
