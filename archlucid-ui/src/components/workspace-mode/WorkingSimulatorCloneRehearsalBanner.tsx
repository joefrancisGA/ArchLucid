"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { useWorkingSimulatorCloneRehearsalBanner } from "@/hooks/use-working-simulator-clone-rehearsal-banner";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { OPERATOR_CALLOUT_WARN_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WORKING_CAREER_REHEARSAL_HELP_LEARN_MORE_LABEL,
  WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_BODY,
  WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_TITLE,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import { WORKING_CAREER_REHEARSAL_HELP_CANONICAL_PATH } from "@/lib/governance/working-career-rehearsal-help-evidence-copy";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { cn } from "@/lib/utils";

export type WorkingSimulatorCloneRehearsalBannerProps = {
  readonly className?: string;
};

/**
 * Persistent Working banner for Simulator-pinned clones (CG-015).
 * Does not auto-switch Guided and does not PUT the Career/Rehearsal door.
 */
export function WorkingSimulatorCloneRehearsalBanner(
  props: WorkingSimulatorCloneRehearsalBannerProps,
): ReactElement | null {
  const chrome = useWorkingSimulatorCloneRehearsalBanner();

  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  if (!chrome.showBanner) {
    return null;
  }

  return (
    <div
      className={cn(OPERATOR_CALLOUT_WARN_CLASS, "mb-3 shadow-sm", props.className)}
      role="status"
      aria-labelledby="working-simulator-clone-rehearsal-banner-title"
      data-testid="working-simulator-clone-rehearsal-banner"
      data-effective-door={chrome.effectiveDoor}
    >
      <h2
        id="working-simulator-clone-rehearsal-banner-title"
        className={cn("m-0 font-semibold text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}
      >
        {WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_TITLE}
      </h2>
      <p className={cn("m-0 mt-1 text-amber-950 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}>
        {WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_BODY}
      </p>
      <div className="mt-3">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link
            href={WORKING_CAREER_REHEARSAL_HELP_CANONICAL_PATH}
            data-testid="working-simulator-clone-rehearsal-banner-help"
          >
            {WORKING_CAREER_REHEARSAL_HELP_LEARN_MORE_LABEL}
          </Link>
        </Button>
      </div>
    </div>
  );
}
