"use client";

import type { ReactElement } from "react";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { OperatorSegmentedModeToolbar } from "@/components/advisory/OperatorSegmentedModeToolbar";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useWorkingCareerRehearsalDoor } from "@/hooks/use-working-career-rehearsal-door";
import {
  WORKING_CAREER_DOOR_DETAIL,
  WORKING_CAREER_REHEARSAL_CHOOSER_ARIA_LABEL,
  WORKING_REHEARSAL_DOOR_DETAIL,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import {
  labelForWorkingCareerRehearsalDoor,
  type WorkingCareerRehearsalDoorId,
} from "@/lib/governance/working-career-rehearsal-door";
import { WORKING_CAREER_REHEARSAL_DOOR_SHORTCUT_KEY } from "@/lib/governance/working-career-rehearsal-door-shortcuts";
import { registryKeyToAriaKeyShortcuts } from "@/lib/shortcut-registry";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import { cn } from "@/lib/utils";

export type WorkingCareerRehearsalChooserProps = {
  readonly className?: string;
};

const DOOR_OPTIONS: readonly { readonly id: WorkingCareerRehearsalDoorId; readonly detail: string }[] = [
  { id: "career", detail: WORKING_CAREER_DOOR_DETAIL },
  { id: "rehearsal", detail: WORKING_REHEARSAL_DOOR_DETAIL },
];

export function workingCareerRehearsalDoorTestId(door: WorkingCareerRehearsalDoorId): string {
  return `working-career-rehearsal-door-${door}`;
}

/**
 * Persistent Working execution door control (Career vs Rehearsal) for the operator shell top bar.
 * Hidden on Guided seats — not a buyer pill (ADR 0086 / AS-077).
 */
export function WorkingCareerRehearsalChooser(props: WorkingCareerRehearsalChooserProps): ReactElement | null {
  const { mode, mounted: workspaceMounted } = useWorkspaceMode();
  const { door, mounted: doorMounted, setDoor } = useWorkingCareerRehearsalDoor();

  if (!workspaceMounted || !doorMounted || !isWorkingWorkspaceMode(mode)) {
    return null;
  }

  const activeDetail =
    DOOR_OPTIONS.find((option) => option.id === door)?.detail ?? WORKING_REHEARSAL_DOOR_DETAIL;

  return (
    <span
      className={cn("inline-flex max-w-[min(100%,18rem)] items-center gap-1.5 sm:max-w-none", props.className)}
      data-testid="working-career-rehearsal-chooser"
      aria-keyshortcuts={registryKeyToAriaKeyShortcuts(WORKING_CAREER_REHEARSAL_DOOR_SHORTCUT_KEY)}
    >
      <OperatorSegmentedModeToolbar
        tabs={DOOR_OPTIONS.map((option) => ({
          id: option.id,
          label: labelForWorkingCareerRehearsalDoor(option.id),
          testId: workingCareerRehearsalDoorTestId(option.id),
        }))}
        activeTabId={door}
        onTabChange={(tabId) => {
          if (tabId === "career" || tabId === "rehearsal") {
            setDoor(tabId);
          }
        }}
        ariaLabel={WORKING_CAREER_REHEARSAL_CHOOSER_ARIA_LABEL}
        className="mb-0 gap-1"
      />
      <FieldHelpTooltip
        label={WORKING_CAREER_REHEARSAL_CHOOSER_ARIA_LABEL}
        hint={activeDetail}
      />
    </span>
  );
}
