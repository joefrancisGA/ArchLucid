"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { RecycleRestoreConsequencePreview } from "@/components/RecycleRestoreConsequencePreview";
import {
  PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_ACTION_LABEL,
  PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_CANCEL_LABEL,
  PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_TITLE,
  projectsRecycleBinRestoreConfirmDescription,
} from "@/lib/projects-recycle-bin-restore-confirm-copy";

export type ProjectsRecycleBinPendingRestore = Readonly<{
  workspaceId: string;
  workspaceName: string;
  projectId: string;
  projectName: string;
}>;

export type ProjectsRecycleBinRestoreConfirmDialogProps = {
  readonly pending: ProjectsRecycleBinPendingRestore | null;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

/** Confirms restore semantics before POSTing a soft-deleted project back to active (TB-2368). */
export function ProjectsRecycleBinRestoreConfirmDialog(
  props: ProjectsRecycleBinRestoreConfirmDialogProps,
): React.JSX.Element {
  const description =
    props.pending === null
      ? ""
      : projectsRecycleBinRestoreConfirmDescription(props.pending.projectName, props.pending.workspaceName);

  return (
    <ConfirmationDialog
      open={props.pending !== null}
      onOpenChange={(open) => {
        if (!open && !props.busy) {
          props.onCancel();
        }
      }}
      title={PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_TITLE}
      description={description}
      confirmLabel={PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_ACTION_LABEL}
      cancelLabel={PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_CANCEL_LABEL}
      variant="default"
      busy={props.busy}
      onConfirm={props.onConfirm}
      extraContent={props.pending !== null ? <RecycleRestoreConsequencePreview /> : null}
    />
  );
}
