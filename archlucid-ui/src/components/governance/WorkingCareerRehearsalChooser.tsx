"use client";

import { ContentSwitcher, Switch } from "@carbon/react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useWorkingCareerRehearsalIntent } from "@/components/governance/WorkingCareerRehearsalIntentProvider";
import { resolveWorkingCareerRehearsalBlockedReason } from "@/lib/governance/working-career-rehearsal-gate";
import {
  WORKING_CAREER_REHEARSAL_INTENT_LABELS,
  type WorkingCareerRehearsalIntentId,
} from "@/lib/governance/working-career-rehearsal-intent";
import { useArchitectWorkspaceChrome } from "@/hooks/useArchitectWorkspaceChrome";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

export type WorkingCareerRehearsalChooserProps = {
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly realExecutionAvailable?: boolean;
};

/** AS-077: persistent Working control — Career vs Rehearsal doors (not Guided). */
export function WorkingCareerRehearsalChooser(props: WorkingCareerRehearsalChooserProps) {
  const workingDesk = useArchitectWorkspaceChrome();
  const { isWorkingMode } = useWorkspaceMode();
  const { intent, mounted, setIntent } = useWorkingCareerRehearsalIntent();

  if (!workingDesk || !isWorkingMode || !mounted) {
    return null;
  }

  const blockedReason = resolveWorkingCareerRehearsalBlockedReason({
    workingDesk: true,
    intent,
    structuralExecutionMode: props.structuralExecutionMode,
    realExecutionAvailable: props.realExecutionAvailable,
  });

  return (
    <div
      className="working-career-rehearsal-chooser"
      data-testid="working-career-rehearsal-chooser"
    >
      <ContentSwitcher
        selectedIndex={intent === "career" ? 0 : 1}
        onChange={(event) => {
          const index = event.index ?? 0;
          const nextIntent: WorkingCareerRehearsalIntentId = index === 0 ? "career" : "rehearsal";

          setIntent(nextIntent);
        }}
        size="sm"
      >
        <Switch name="career" text={WORKING_CAREER_REHEARSAL_INTENT_LABELS.career} />
        <Switch name="rehearsal" text={WORKING_CAREER_REHEARSAL_INTENT_LABELS.rehearsal} />
      </ContentSwitcher>
      {blockedReason !== null ? (
        <p
          className="working-career-rehearsal-chooser__blocked-reason"
          data-testid="working-career-rehearsal-blocked-reason"
        >
          {blockedReason}
        </p>
      ) : null}
    </div>
  );
}
