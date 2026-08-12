"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { OPERATOR_DANGER, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type GcpConnectionDisconnectTarget = {
  readonly connectionId: string;
  readonly projectId: string;
};

type GcpConnectionDisconnectDialogProps = {
  readonly target: GcpConnectionDisconnectTarget | null;
  readonly busy: boolean;
  readonly errorMessage?: string | null;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

function resolveDisconnectTitle(projectId: string): string {
  if (projectId.length > 0) {
    return `Disconnect GCP project ${projectId}?`;
  }

  return "Disconnect GCP project?";
}

/** Domain wrapper over {@link ConfirmationDialog} for GCP disconnect (TB-2372). */
export function GcpConnectionDisconnectDialog(props: GcpConnectionDisconnectDialogProps): React.JSX.Element {
  const projectId = props.target?.projectId ?? "";
  const errorMessage = props.errorMessage ?? null;

  return (
    <ConfirmationDialog
      open={props.target !== null}
      onOpenChange={(open) => {
        if (!open && !props.busy) {
          props.onCancel();
        }
      }}
      title={resolveDisconnectTitle(projectId)}
      description="Scheduled read-only inventory collection for this GCP project will stop. Previously collected inventory packages and any signed review records that cite them are retained."
      confirmLabel="Disconnect"
      variant="destructive"
      busy={props.busy}
      onConfirm={props.onConfirm}
      extraContent={
        errorMessage !== null ? (
          <p
            className={cn(OPERATOR_TYPOGRAPHY.body, OPERATOR_DANGER.text)}
            role="alert"
            data-testid="gcp-connection-disconnect-error"
          >
            {errorMessage}
          </p>
        ) : null
      }
    />
  );
}
