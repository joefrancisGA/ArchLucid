"use client";

import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import type { OperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";

type OperateFeaturesUnlockPanelProps = {
  readonly phase: OperateNavUnlockPhase;
  readonly onUnlock: () => void;
};

/** Pilot-only sidebar affordance: reveal Operate analysis/governance/operations groups on demand. */
export function OperateFeaturesUnlockPanel(props: OperateFeaturesUnlockPanelProps): ReactElement | null {
  if (props.phase !== 0) {
    return null;
  }

  return (
    <div
      className="mt-2 space-y-2 border-t border-neutral-200 px-2 pt-3 dark:border-neutral-700"
      data-testid="operate-features-unlock-panel"
    >
      <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
        Compare, graph, and governance tools stay hidden during your first pilot session. Unlock them when you need
        deeper analysis.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-start text-xs font-medium"
        data-testid="nav-advanced-unlock"
        onClick={props.onUnlock}
      >
        Unlock Operate features
      </Button>
    </div>
  );
}
