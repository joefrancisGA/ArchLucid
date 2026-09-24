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

export type DiagramReconcileIngestConfirmDialogProps = {
  readonly open: boolean;
  readonly reviewTitle: string;
  readonly runId: string;
  readonly existingNodeCount: number;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
};

export function DiagramReconcileIngestConfirmDialog(
  props: DiagramReconcileIngestConfirmDialogProps,
): React.JSX.Element {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent data-testid="infra-diagram-reconcile-ingest-confirm-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Replace existing diagram model?</AlertDialogTitle>
          <AlertDialogDescription>
            Ingest replaces the structured diagram model on review record{" "}
            <strong>{props.reviewTitle}</strong> ({props.runId}). The current model has{" "}
            {props.existingNodeCount} active node(s). This mutation is recorded on the audit trail.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            data-testid="infra-diagram-reconcile-ingest-confirm-action"
            onClick={props.onConfirm}
          >
            Replace model and ingest
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
