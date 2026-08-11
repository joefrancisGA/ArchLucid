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
  PROJECT_DELETE_CONFIRM_ACTION_LABEL,
  PROJECT_DELETE_CONFIRM_CANCEL_LABEL,
  PROJECT_DELETE_CONFIRM_TITLE,
  projectDeleteConfirmDescription,
} from "@/lib/projects-delete-confirm-copy";
import { cn } from "@/lib/utils";

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
    <AlertDialog
      open={props.pending !== null}
      onOpenChange={(open) => {
        if (!open) {
          props.onCancel();
        }
      }}
    >
      <AlertDialogContent data-testid="project-delete-confirm-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {PROJECT_DELETE_CONFIRM_TITLE}
          </AlertDialogTitle>
          <AlertDialogDescription className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.busy} data-testid="project-delete-confirm-cancel">
            {PROJECT_DELETE_CONFIRM_CANCEL_LABEL}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={props.busy}
            data-testid="project-delete-confirm-confirm"
            onClick={(event) => {
              event.preventDefault();
              props.onConfirm();
            }}
          >
            {props.busy ? "Deleting…" : PROJECT_DELETE_CONFIRM_ACTION_LABEL}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
