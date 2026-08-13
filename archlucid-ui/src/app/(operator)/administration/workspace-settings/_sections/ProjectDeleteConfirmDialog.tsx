"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import {
  PROJECT_DELETE_CONFIRM_ACTION_LABEL,
  PROJECT_DELETE_CONFIRM_CANCEL_LABEL,
  PROJECT_DELETE_CONFIRM_TITLE,
  projectDeleteConfirmDescription,
} from "@/lib/projects-delete-confirm-copy";

export type ProjectDeletePending = Readonly<{
  workspaceId: string;
  workspaceName: string;
  projectId: string;
  projectName: string;
}>;

export type ProjectDeleteConfirmDialogProps = {
  readonly pending: ProjectDeletePending | null;
  readonly retentionDays: number;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

/** Confirms soft-delete semantics before DELETE on the tenant workspace project endpoint (TB-1179). */
export function ProjectDeleteConfirmDialog(props: ProjectDeleteConfirmDialogProps): React.JSX.Element {
  const description =
    props.pending === null
      ? ""
      : projectDeleteConfirmDescription(
          props.pending.projectName,
          props.pending.workspaceName,
          props.retentionDays,
        );

  return (
    <ConfirmationDialog
      open={props.pending !== null}
      onOpenChange={(open) => {
        if (!open && !props.busy) {
          props.onCancel();
        }
      }}
      title={PROJECT_DELETE_CONFIRM_TITLE}
      description={description}
      confirmLabel={PROJECT_DELETE_CONFIRM_ACTION_LABEL}
      cancelLabel={PROJECT_DELETE_CONFIRM_CANCEL_LABEL}
      variant="destructive"
      busy={props.busy}
      onConfirm={props.onConfirm}
    />
  );
}
