"use client";

import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { CORE_PILOT_PATH_STREAMLINED_LABELS } from "@/lib/core-pilot-path-vocabulary";

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
      <p className="m-0 text-xs leading-relaxed text-neutral-800 dark:text-neutral-200">
        {CORE_PILOT_PATH_STREAMLINED_LABELS.operateAutoUnlockHint}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto px-0 py-0 text-xs font-medium text-teal-800 hover:bg-transparent hover:underline dark:text-teal-300"
        data-testid="operate-unlock-auto-hint-dismiss"
        onClick={props.onDismiss}
      >
        Dismiss
      </Button>
    </div>
  );
}
