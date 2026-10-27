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
  readonly existingNodeCount: number | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
};

export function DiagramReconcileIngestConfirmDialog(
  props: DiagramReconcileIngestConfirmDialogProps,
): React.JSX.Element {
  const replacingExisting =
    props.existingNodeCount !== null && Number.isFinite(props.existingNodeCount) && props.existingNodeCount > 0;
  const existingNodeCountLabel =
    props.existingNodeCount !== null && Number.isFinite(props.existingNodeCount)
      ? String(Math.trunc(props.existingNodeCount))
      : "Active node count was not stored.";

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent data-testid="infra-diagram-reconcile-ingest-confirm-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {replacingExisting ? "Replace existing diagram model?" : "Ingest diagram model?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {replacingExisting ? (
              <>
                Ingest replaces the structured diagram model on review record{" "}
                <strong>{props.reviewTitle}</strong> ({props.runId}). The current model has{" "}
                {existingNodeCountLabel} active node(s). This mutation is recorded on the audit trail.
              </>
            ) : (
              <>
                Ingest saves a structured diagram model on review record <strong>{props.reviewTitle}</strong> (
                {props.runId}). This mutation is recorded on the audit trail.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            data-testid="infra-diagram-reconcile-ingest-confirm-action"
            onClick={props.onConfirm}
          >
            {replacingExisting ? "Replace model and ingest" : "Ingest diagram"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
