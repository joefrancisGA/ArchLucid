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
import { RecycleRestoreConsequencePreview } from "@/components/RecycleRestoreConsequencePreview";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_ACTION_LABEL,
  PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_CANCEL_LABEL,
  PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_TITLE,
  projectsRecycleBinRestoreConfirmDescription,
} from "@/lib/projects-recycle-bin-restore-confirm-copy";
import { cn } from "@/lib/utils";

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

/** Confirms restore semantics before POSTing a soft-deleted project back to active. */
export function ProjectsRecycleBinRestoreConfirmDialog(
  props: ProjectsRecycleBinRestoreConfirmDialogProps,
): React.JSX.Element {
  const description =
    props.pending === null
      ? ""
      : projectsRecycleBinRestoreConfirmDescription(props.pending.projectName, props.pending.workspaceName);

  return (
    <AlertDialog
      open={props.pending !== null}
      onOpenChange={(open) => {
        if (!open) {
          props.onCancel();
        }
      }}
    >
      <AlertDialogContent data-testid="projects-recycle-bin-restore-confirm-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_TITLE}
          </AlertDialogTitle>
          <AlertDialogDescription className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {props.pending !== null ? <RecycleRestoreConsequencePreview /> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.busy} data-testid="projects-recycle-bin-restore-confirm-cancel">
            {PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_CANCEL_LABEL}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={props.busy}
            data-testid="projects-recycle-bin-restore-confirm-confirm"
            onClick={(event) => {
              event.preventDefault();
              props.onConfirm();
            }}
          >
            {props.busy ? "Restoring…" : PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_ACTION_LABEL}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
