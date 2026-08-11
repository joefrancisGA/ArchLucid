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
import { buttonVariants } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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

export function GcpConnectionDisconnectDialog(props: GcpConnectionDisconnectDialogProps): React.JSX.Element {
  const projectId = props.target?.projectId ?? "";
  const errorMessage = props.errorMessage ?? null;

  return (
    <AlertDialog
      open={props.target !== null}
      onOpenChange={(open) => {
        if (!open) {
          props.onCancel();
        }
      }}
    >
      <AlertDialogContent data-testid="gcp-connection-disconnect-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {projectId.length > 0 ? `Disconnect GCP project ${projectId}?` : "Disconnect GCP project?"}
          </AlertDialogTitle>
          <AlertDialogDescription className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
            Scheduled read-only inventory collection for this GCP project will stop. Previously collected inventory
            packages and any signed review records that cite them are retained.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage !== null ? (
          <p
            className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")}
            role="alert"
            data-testid="gcp-connection-disconnect-error"
          >
            {errorMessage}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.busy} data-testid="gcp-connection-disconnect-cancel">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={props.busy}
            data-testid="gcp-connection-disconnect-confirm"
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={(event) => {
              event.preventDefault();
              props.onConfirm();
            }}
          >
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
