"use client";

import { OperatorSegmentedModeToolbar } from "@/components/advisory/OperatorSegmentedModeToolbar";
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

const INTENT_OPTIONS: readonly WorkingCareerRehearsalIntentId[] = ["career", "rehearsal"];

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
      <OperatorSegmentedModeToolbar
        tabs={INTENT_OPTIONS.map((option) => ({
          id: option,
          label: WORKING_CAREER_REHEARSAL_INTENT_LABELS[option],
          testId: `working-career-rehearsal-intent-${option}`,
        }))}
        activeTabId={intent}
        onTabChange={(tabId) => {
          if (tabId === "career" || tabId === "rehearsal") {
            setIntent(tabId);
          }
        }}
        ariaLabel="Working career or rehearsal intent"
        className="mb-0 gap-1"
      />
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
