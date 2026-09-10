"use client";

import { OperatorSegmentedModeToolbar } from "@/components/advisory/OperatorSegmentedModeToolbar";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useWorkingCareerRehearsalIntent } from "@/components/governance/WorkingCareerRehearsalIntentProvider";
import { WORKING_CAREER_REHEARSAL_CHOOSER_ARIA_LABEL } from "@/lib/governance/working-career-rehearsal-door-copy";
import { resolveWorkingCareerRehearsalBlockedReason } from "@/lib/governance/working-career-rehearsal-gate";
import {
  WORKING_CAREER_REHEARSAL_INTENT_IDS,
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
      <OperatorSegmentedModeToolbar
        tabs={WORKING_CAREER_REHEARSAL_INTENT_IDS.map((intentId) => ({
          id: intentId,
          label: WORKING_CAREER_REHEARSAL_INTENT_LABELS[intentId],
          testId: `working-career-rehearsal-intent-${intentId}`,
        }))}
        activeTabId={intent}
        onTabChange={(tabId) => {
          if (tabId === "career" || tabId === "rehearsal") {
            setIntent(tabId);
          }
        }}
        ariaLabel={WORKING_CAREER_REHEARSAL_CHOOSER_ARIA_LABEL}
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
