"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { OperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";
import { cn } from "@/lib/utils";

type GovernanceAvailableSidebarNudgeProps = {
  readonly hasCommittedArchitectureReview: boolean;
  readonly operateNavUnlockPhase: OperateNavUnlockPhase;
};

/** Post-first-commit strip: surfaces governance without adding a permanent nav item (TB-532). */
export function GovernanceAvailableSidebarNudge(
  props: GovernanceAvailableSidebarNudgeProps,
): ReactElement | null {
  if (!props.hasCommittedArchitectureReview || props.operateNavUnlockPhase !== 1) {
    return null;
  }

  return (
    <div
      className="mx-2 mb-2 mt-1 rounded-md border border-teal-700/30 bg-teal-50/80 px-3 py-2 dark:border-teal-800/50 dark:bg-teal-950/30"
      data-testid="governance-available-nav-nudge"
    >
      <p className={cn("m-0 font-medium text-teal-950 dark:text-teal-100", OPERATOR_TYPOGRAPHY.helper)}>
        Governance available
      </p>
      <p className={cn("m-0 mt-1 text-teal-900/90 dark:text-teal-200/90", OPERATOR_TYPOGRAPHY.helper)}>
        Your first review is finalized — open the approval queue to record decisions and audit trail entries.
      </p>
      <Link href="/governance/approval-queue" className={cn("mt-2 inline-block", OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.helper)}>
        Open approval queue
      </Link>
    </div>
  );
}
