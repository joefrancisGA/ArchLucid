"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  PROJECT_DELETE_ACTIVE_SCOPE_WARNING,
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
  isActiveScope: boolean;
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

  const extraContent =
    props.pending?.isActiveScope === true ? (
      <p
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="project-delete-active-scope-warning"
        role="status"
      >
        {PROJECT_DELETE_ACTIVE_SCOPE_WARNING}
      </p>
    ) : undefined;

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
      extraContent={extraContent}
      confirmLabel={PROJECT_DELETE_CONFIRM_ACTION_LABEL}
      cancelLabel={PROJECT_DELETE_CONFIRM_CANCEL_LABEL}
      variant="destructive"
      busy={props.busy}
      onConfirm={props.onConfirm}
    />
  );
}
