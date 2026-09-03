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

type InAppNavigationGuardDialogProps = {
  readonly open: boolean;
  readonly message: string;
  readonly onConfirmLeave: () => void;
  readonly onCancelLeave: () => void;
};

export function InAppNavigationGuardDialog(props: InAppNavigationGuardDialogProps): React.JSX.Element {
  return (
    <AlertDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) {
          props.onCancelLeave();
        }
      }}
    >
      <AlertDialogContent data-testid="in-app-navigation-guard-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>{props.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" onClick={props.onCancelLeave}>
            Stay on page
          </AlertDialogCancel>
          <AlertDialogAction type="button" onClick={props.onConfirmLeave}>
            Leave without saving
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
