"use client";

import { useContext, type ReactElement } from "react";

import { WorkingPracticeStartHonestyNotice } from "@/components/governance/WorkingPracticeStartHonestyNotice";
import { WorkingRecordSimulatorStartHonestyNotice } from "@/components/governance/WorkingRecordSimulatorStartHonestyNotice";
import { WorkspaceModeContext } from "@/components/WorkspaceModeProvider";
import { cn } from "@/lib/utils";

export type WorkingExecuteStartHonestyNoticesProps = {
  readonly className?: string;
};

/**
 * IH-025 leftover — Record + Simulator / Practice honesty next to Start or re-run.
 * CTA stays enabled. Host Mode is not flipped (no G-REAL-06).
 *
 * Do not call useWorkspaceMode here. Wizard and strip tests often omit the provider;
 * a missing context must skip child hooks that would otherwise throw.
 */
export function WorkingExecuteStartHonestyNotices(
  props: WorkingExecuteStartHonestyNoticesProps,
): ReactElement | null {
  const workspace = useContext(WorkspaceModeContext);

  if (workspace === null || !workspace.mounted) {
    return null;
  }

  return (
    <div
      className={cn("space-y-1", props.className)}
      data-testid="working-execute-start-honesty-notices"
    >
      <WorkingRecordSimulatorStartHonestyNotice />
      <WorkingPracticeStartHonestyNotice />
    </div>
  );
}
