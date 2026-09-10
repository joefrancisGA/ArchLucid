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
import {
  EXTRACT_UPLOAD_BASELINE_OVERWRITE_CANCEL,
  EXTRACT_UPLOAD_BASELINE_OVERWRITE_CONFIRM,
  EXTRACT_UPLOAD_BASELINE_OVERWRITE_DESCRIPTION,
  EXTRACT_UPLOAD_BASELINE_OVERWRITE_TITLE,
} from "@/lib/extract-upload-settings-page-copy";

export type ExtractUploadBaselineOverwriteConfirmDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
};

export function ExtractUploadBaselineOverwriteConfirmDialog(
  props: ExtractUploadBaselineOverwriteConfirmDialogProps,
): React.JSX.Element {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent data-testid="extract-upload-baseline-overwrite-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{EXTRACT_UPLOAD_BASELINE_OVERWRITE_TITLE}</AlertDialogTitle>
          <AlertDialogDescription>{EXTRACT_UPLOAD_BASELINE_OVERWRITE_DESCRIPTION}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="extract-upload-baseline-overwrite-cancel">
            {EXTRACT_UPLOAD_BASELINE_OVERWRITE_CANCEL}
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid="extract-upload-baseline-overwrite-confirm"
            onClick={() => {
              props.onConfirm();
            }}
          >
            {EXTRACT_UPLOAD_BASELINE_OVERWRITE_CONFIRM}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
