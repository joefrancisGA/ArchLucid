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
import {
  WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_LEAD,
  WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_STAY_CTA,
  WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_SWITCH_CTA,
  WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_TITLE,
} from "@/lib/workspace-mode/workspace-mode-copy";

export type GuidedModeSwitchToWorkingDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSwitchToWorking: () => void;
};

/** Confirms switching from Guided to Working mode from the toolbar chip. */
export function GuidedModeSwitchToWorkingDialog(
  props: GuidedModeSwitchToWorkingDialogProps,
): React.JSX.Element {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent data-testid="guided-mode-switch-to-working-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_TITLE}</AlertDialogTitle>
          <AlertDialogDescription>{WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_LEAD}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="guided-mode-switch-to-working-stay">
            {WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_STAY_CTA}
          </AlertDialogCancel>
          <Button
            type="button"
            data-testid="guided-mode-switch-to-working-confirm"
            onClick={() => {
              props.onSwitchToWorking();
            }}
          >
            {WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_SWITCH_CTA}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
