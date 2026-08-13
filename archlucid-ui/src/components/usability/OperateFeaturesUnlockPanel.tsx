"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { FirstPilotOperateUnlockVocabularyRail } from "@/components/FirstPilotOperateUnlockVocabularyRail";
import { CORE_PILOT_PATH_STREAMLINED_LABELS } from "@/lib/vocabulary/core-pilot-path-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { WORKSPACE_NAVIGATION_HELP_HREF } from "@/lib/workspace-navigation-help-alignment";
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
      id="operate-features-unlock-panel"
      className="mt-2 space-y-2 border-t border-neutral-200 px-2 pt-3 dark:border-neutral-700"
      data-testid="operate-features-unlock-panel"
    >
      <FirstPilotOperateUnlockVocabularyRail currentSurfaceId="operate-unlock" />
      <p className={cn("font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>Need deeper analysis?</p>
      <p className={cn("leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {CORE_PILOT_PATH_STREAMLINED_LABELS.operateUnlockLead}
      </p>
      <ul className={cn("list-disc space-y-1 pl-4 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        <li>
          <span className="font-medium text-neutral-700 dark:text-neutral-300">Unlocks:</span>{" "}
          {CORE_PILOT_PATH_STREAMLINED_LABELS.operateUnlockAnalysisUnlocks}
        </li>
        <li>
          <span className="font-medium text-neutral-700 dark:text-neutral-300">Still hidden:</span>{" "}
          {CORE_PILOT_PATH_STREAMLINED_LABELS.operateUnlockStillHidden}
        </li>
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("w-full justify-start font-medium", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="nav-advanced-unlock"
        onClick={props.onUnlock}
      >
        Show analysis tools
      </Button>
      <p className={cn("m-0 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        <Link href={WORKSPACE_NAVIGATION_HELP_HREF} className={OPERATOR_LINK.inline} data-testid="pilot-nav-profile-help-link">
          How pilot navigation works
        </Link>
      </p>
    </div>
  );
}
