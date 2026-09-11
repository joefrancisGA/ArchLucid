"use client";

import Link from "next/link";
import { useCallback, useState, type ReactElement } from "react";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { OperatorSegmentedModeToolbar } from "@/components/advisory/OperatorSegmentedModeToolbar";
import { WorkingCareerDoorBlockedDialog } from "@/components/workspace-mode/WorkingCareerDoorBlockedDialog";
import { WorkingCareerRehearsalDoorChangeConfirmDialog } from "@/components/workspace-mode/WorkingCareerRehearsalDoorChangeConfirmDialog";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { StatusTag } from "@/components/ui/status-tag";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";
import { useHasInFlightReviewPipeline } from "@/hooks/use-has-in-flight-review-pipeline";
import {
  useEvaluateWorkingCareerDoorGate,
  useWorkingCareerDoorGate,
} from "@/hooks/use-working-career-door-gate";
import { useSessionAiReadiness } from "@/hooks/session-ai-readiness-context";
import type { WorkingCareerDoorGateResult } from "@/lib/governance/working-career-door-gate";
import { resolveWorkingCareerDoorHostModeMatrixCell } from "@/lib/governance/working-career-door-host-mode-matrix";
import { useWorkingCareerRehearsalDoor } from "@/hooks/use-working-career-rehearsal-door";
import {
  WORKING_CAREER_DOOR_DETAIL,
  WORKING_CAREER_REHEARSAL_CHOOSER_ARIA_LABEL,
  WORKING_CAREER_REHEARSAL_HELP_LEARN_MORE_LABEL,
  WORKING_REHEARSAL_DOOR_DETAIL,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import { WORKING_CAREER_REHEARSAL_HELP_CANONICAL_PATH } from "@/lib/governance/working-career-rehearsal-help-evidence-copy";
import {
  cycleWorkingCareerRehearsalDoor,
  labelForWorkingCareerRehearsalDoor,
  type WorkingCareerRehearsalDoorId,
} from "@/lib/governance/working-career-rehearsal-door";
import { shouldConfirmWorkingCareerRehearsalDoorChange } from "@/lib/governance/working-career-rehearsal-door-mid-review-confirm";
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
 * Hidden on Guided seats — not a buyer pill (ADR 0086 / AS-077). Career is blocked when the host
 * cannot run Real execute (AS-078 / TB-1299). AS-082 learn-more handoff: `/help/career-rehearsal-doors`.
 * In-flight analysis requires confirm before the account door changes (CG-018); stamp lock is CG-019.
 */
export function WorkingCareerRehearsalChooser(props: WorkingCareerRehearsalChooserProps): ReactElement | null {
  const { mode, mounted: workspaceMounted } = useWorkspaceMode();
  const { door, mounted: doorMounted, setDoor } = useWorkingCareerRehearsalDoor();
  const gate = useWorkingCareerDoorGate(door);
  const evaluateGate = useEvaluateWorkingCareerDoorGate();
  const hasInFlightReview = useHasInFlightReviewPipeline();
  const { mode: sessionMode } = useAgentExecutionMode();
  const readiness = useSessionAiReadiness();
  const matrix = resolveWorkingCareerDoorHostModeMatrixCell({
    selectedDoor: door,
    gate,
    isSessionReal: readiness.isSessionReal,
    hostMode: readiness.hostMode,
    sessionMode,
  });
  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false);
  const [blockedDialogGate, setBlockedDialogGate] = useState<WorkingCareerDoorGateResult | null>(null);
  const [pendingDoor, setPendingDoor] = useState<WorkingCareerRehearsalDoorId | null>(null);

  const requestDoor = useCallback(
    (nextDoor: WorkingCareerRehearsalDoorId) => {
      const nextGate = evaluateGate(nextDoor);

      if (nextGate.isCareerExecuteBlocked) {
        setBlockedDialogGate(nextGate);
        setBlockedDialogOpen(true);

        return;
      }

      if (
        shouldConfirmWorkingCareerRehearsalDoorChange({
          currentDoor: door,
          nextDoor,
          hasInFlightReviewPipeline: hasInFlightReview,
        })
      ) {
        setPendingDoor(nextDoor);

        return;
      }

      setDoor(nextDoor);
    },
    [door, evaluateGate, hasInFlightReview, setDoor],
  );

  const cycleDoor = useCallback(() => {
    const nextDoor = cycleWorkingCareerRehearsalDoor(door);

    requestDoor(nextDoor);
  }, [door, requestDoor]);

  useKeyboardShortcuts({
    [WORKING_CAREER_REHEARSAL_DOOR_SHORTCUT_KEY]: {
      description: "Cycle Working execution door",
      handler: cycleDoor,
    },
  });

  if (!workspaceMounted || !doorMounted || !isWorkingWorkspaceMode(mode)) {
    return null;
  }

  const activeDetail = matrix.showStatusTag
    ? matrix.detail
    : DOOR_OPTIONS.find((option) => option.id === door)?.detail ?? WORKING_REHEARSAL_DOOR_DETAIL;

  return (
    <>
      <span
        className={cn("inline-flex max-w-[min(100%,20rem)] items-center gap-1.5 sm:max-w-none", props.className)}
        data-testid="working-career-rehearsal-chooser"
        data-effective-door={matrix.effectiveDoor}
        data-door-host-mode-cell={matrix.cellId}
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
              requestDoor(tabId);
            }
          }}
          ariaLabel={WORKING_CAREER_REHEARSAL_CHOOSER_ARIA_LABEL}
          className="mb-0 gap-1"
        />
        {matrix.showStatusTag ? (
          <StatusTag
            kind={matrix.statusTagKind}
            label={matrix.statusLabel}
            className="shrink-0"
            data-testid={matrix.matrixTestId}
          />
        ) : null}
        <FieldHelpTooltip
          label={WORKING_CAREER_REHEARSAL_CHOOSER_ARIA_LABEL}
          hint={
            <>
              {activeDetail}
              {" "}
              <Link href={WORKING_CAREER_REHEARSAL_HELP_CANONICAL_PATH} className="underline">
                {WORKING_CAREER_REHEARSAL_HELP_LEARN_MORE_LABEL}
              </Link>
            </>
          }
        />
      </span>
      <WorkingCareerDoorBlockedDialog
        open={blockedDialogOpen}
        onOpenChange={setBlockedDialogOpen}
        gate={blockedDialogGate ?? gate}
        onSwitchToRehearsal={() => {
          setDoor("rehearsal");
        }}
      />
      <WorkingCareerRehearsalDoorChangeConfirmDialog
        open={pendingDoor !== null}
        currentDoor={door}
        nextDoor={pendingDoor}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDoor(null);
          }
        }}
        onConfirm={() => {
          if (pendingDoor !== null) {
            setDoor(pendingDoor);
          }

          setPendingDoor(null);
        }}
      />
    </>
  );
}
