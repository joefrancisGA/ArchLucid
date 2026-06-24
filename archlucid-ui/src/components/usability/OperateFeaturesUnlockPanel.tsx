"use client";

import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import type { OperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";

type OperateFeaturesUnlockPanelProps = {
  readonly phase: OperateNavUnlockPhase;
  readonly onUnlock: () => void;
};

/** Pilot-only sidebar affordance: reveal Operate analysis/governance groups on demand. */
export function OperateFeaturesUnlockPanel(props: OperateFeaturesUnlockPanelProps): ReactElement | null {
  if (props.phase !== 0) {
    return null;
  }

  return (
    <div
      className="mt-2 space-y-2 border-t border-neutral-200 px-2 pt-3 dark:border-neutral-700"
      data-testid="operate-features-unlock-panel"
    >
      <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">Need deeper analysis?</p>
      <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
        Your first session focuses on starting and finalizing a review package. Compare, evidence graph, ask-this-review,
        and governance routes stay hidden until you unlock them — or until you finalize your first review package.
      </p>
      <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
        <li>
          <span className="font-medium text-neutral-700 dark:text-neutral-300">Unlocks:</span> Analysis — compare,
          graph, replay, and Q&amp;A
        </li>
        <li>
          <span className="font-medium text-neutral-700 dark:text-neutral-300">Still hidden:</span> Governance —
          policy packs, audit log, alerts (until you need them)
        </li>
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-start text-xs font-medium"
        data-testid="nav-advanced-unlock"
        onClick={props.onUnlock}
      >
        Show analysis tools
      </Button>
    </div>
  );
}
