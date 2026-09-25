"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export type ResourceHubCreateRemediationConfirmDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly findingTitle: string;
  readonly resourceTitle: string;
  readonly busy: boolean;
  readonly onConfirm: () => void;
};

export function ResourceHubCreateRemediationConfirmDialog(
  props: ResourceHubCreateRemediationConfirmDialogProps,
): React.JSX.Element {
  const { open, onOpenChange, findingTitle, resourceTitle, busy, onConfirm } = props;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="infra-resource-hub-create-remediation-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Create remediation instance?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-al-text-secondary">
              <p className="m-0">
                This will match a remediation pattern for the finding and create a persisted remediation instance in the
                remediation factory.
              </p>
              <dl className="m-0 grid gap-1">
                <div>
                  <dt className="font-medium text-al-text-primary">Finding</dt>
                  <dd>{findingTitle}</dd>
                </div>
                <div>
                  <dt className="font-medium text-al-text-primary">Resource</dt>
                  <dd>{resourceTitle}</dd>
                </div>
              </dl>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="primary"
            data-testid="infra-resource-hub-create-remediation-confirm"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Creating…" : "Create remediation"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
