"use client";

import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useWorkingCareerRehearsalDoor } from "@/hooks/use-working-career-rehearsal-door";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  shouldShowWorkingPracticeStartHonesty,
  WORKING_PRACTICE_START_HONESTY_SENTENCE,
  WORKING_PRACTICE_START_HONESTY_TEST_ID,
} from "@/lib/governance/working-practice-start-honesty";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import { cn } from "@/lib/utils";

export type WorkingPracticeStartHonestyNoticeProps = {
  readonly className?: string;
};

/** IH-026 — inline Practice labeling before Start/execute (CTA stays enabled). */
export function WorkingPracticeStartHonestyNotice(
  props: WorkingPracticeStartHonestyNoticeProps,
): ReactElement | null {
  const { mode, mounted: workspaceMounted } = useWorkspaceMode();
  const { door, mounted: doorMounted } = useWorkingCareerRehearsalDoor();

  if (!workspaceMounted || !doorMounted) {
    return null;
  }

  const workingMode = isWorkingWorkspaceMode(mode);

  if (!shouldShowWorkingPracticeStartHonesty({ workingMode, selectedDoor: door })) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper, props.className)}
      data-testid={WORKING_PRACTICE_START_HONESTY_TEST_ID}
      role="note"
    >
      {WORKING_PRACTICE_START_HONESTY_SENTENCE}
    </p>
  );
}
