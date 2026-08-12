"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { ROLES_MATRIX_CONFIRMATION_DIALOG } from "./roles-matrix-constants";

export type RolesMatrixConfirmationCopy = {
  readonly title: string;
  readonly primaryLabel: string;
  readonly addedLabels: readonly string[];
  readonly removedLabels: readonly string[];
  readonly highRiskLabels: readonly string[];
};

type SettingsRolesMatrixConfirmDialogProps = {
  readonly open: boolean;
  readonly copy: RolesMatrixConfirmationCopy | null;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

function RolesMatrixConfirmationExtraContent(props: { readonly copy: RolesMatrixConfirmationCopy }): React.JSX.Element {
  return (
    <div className="space-y-3">
      {props.copy.addedLabels.length > 0 ? (
        <div className="space-y-1">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Permissions to grant</p>
          <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
            {props.copy.addedLabels.map((label) => (
              <li key={`add-${label}`}>{label}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {props.copy.removedLabels.length > 0 ? (
        <div className="space-y-1">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Permissions to remove</p>
          <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
            {props.copy.removedLabels.map((label) => (
              <li key={`remove-${label}`}>{label}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {props.copy.highRiskLabels.length > 0 ? (
        <div className="space-y-1 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-700/60 dark:bg-amber-950/40">
          <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>
            {ROLES_MATRIX_CONFIRMATION_DIALOG.highRiskLead}
          </p>
          <ul className={cn("m-0 list-disc space-y-1 pl-5 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>
            {props.copy.highRiskLabels.map((label) => (
              <li key={`high-risk-${label}`}>{label}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** Domain wrapper over {@link ConfirmationDialog} for roles matrix save/create/clone (TB-2374). */
export function SettingsRolesMatrixConfirmDialog(
  props: SettingsRolesMatrixConfirmDialogProps,
): React.JSX.Element {
  const title = props.copy?.title ?? "Confirm role change?";
  const confirmLabel = props.copy?.primaryLabel ?? "Confirm";

  return (
    <ConfirmationDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) {
          props.onCancel();
        }
      }}
      title={title}
      description="Review the permission changes below before continuing."
      confirmLabel={confirmLabel}
      variant="default"
      onConfirm={props.onConfirm}
      extraContent={props.copy !== null ? <RolesMatrixConfirmationExtraContent copy={props.copy} /> : null}
    />
  );
}
