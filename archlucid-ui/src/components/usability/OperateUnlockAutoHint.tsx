"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactElement } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { CORE_PILOT_PATH_STREAMLINED_LABELS } from "@/lib/vocabulary/core-pilot-path-vocabulary";

type OperateUnlockAutoHintProps = {
  readonly visible: boolean;
  readonly onDismiss: () => void;
};

/** Non-modal sidebar hint after Operate analysis nav auto-unlocks on first committed review. */
export function OperateUnlockAutoHint(props: OperateUnlockAutoHintProps): ReactElement | null {
  if (!props.visible) {
    return null;
  }

  return (
    <div
      className="mt-2 space-y-2 rounded-md border border-teal-200 bg-teal-50/80 px-2 py-2 dark:border-teal-900 dark:bg-teal-950/40"
      data-testid="operate-unlock-auto-hint"
      role="status"
    >
      <p className={cn("m-0 leading-relaxed text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
        {CORE_PILOT_PATH_STREAMLINED_LABELS.operateAutoUnlockHint}
      </p>
      <DismissControl
        className={cn("h-auto px-0 font-medium text-teal-800 dark:text-teal-300", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="operate-unlock-auto-hint-dismiss"
        onDismiss={props.onDismiss}
      />
    </div>
  );
}
