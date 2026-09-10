"use client";

import Link from "next/link";
import type { ReactElement } from "react";

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
  WORKING_CAREER_DOOR_BLOCKED_TITLE,
  WORKING_CAREER_DOOR_OPEN_PLATFORM_SETTINGS_ACTION,
  WORKING_CAREER_DOOR_SWITCH_TO_REHEARSAL_ACTION,
} from "@/lib/governance/working-career-door-gate-copy";
import type { WorkingCareerDoorGateResult } from "@/lib/governance/working-career-door-gate";

export type WorkingCareerDoorBlockedDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly gate: WorkingCareerDoorGateResult;
  readonly onSwitchToRehearsal: () => void;
};

export function WorkingCareerDoorBlockedDialog(
  props: WorkingCareerDoorBlockedDialogProps,
): ReactElement {
  const blockedDetail = props.gate.blockedDetail ?? WORKING_CAREER_DOOR_BLOCKED_TITLE;

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent data-testid="working-career-door-blocked-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{WORKING_CAREER_DOOR_BLOCKED_TITLE}</AlertDialogTitle>
          <AlertDialogDescription>{blockedDetail}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel>Close</AlertDialogCancel>
          <Button
            type="button"
            variant="secondary"
            data-testid="working-career-door-switch-to-rehearsal"
            onClick={() => {
              props.onSwitchToRehearsal();
              props.onOpenChange(false);
            }}
          >
            {WORKING_CAREER_DOOR_SWITCH_TO_REHEARSAL_ACTION}
          </Button>
          <Button type="button" variant="outline" asChild data-testid="working-career-door-platform-settings">
            <Link href={props.gate.platformSettingsHref}>{WORKING_CAREER_DOOR_OPEN_PLATFORM_SETTINGS_ACTION}</Link>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
