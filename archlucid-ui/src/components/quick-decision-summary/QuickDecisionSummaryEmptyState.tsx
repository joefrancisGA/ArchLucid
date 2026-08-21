import Link from "next/link";
import type { ReactElement } from "react";

import {
  ARCHITECTURE_CREATED_FINDINGS_FINALIZE_ELIGIBLE_EMPTY,
  ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_ACTIVITY_LINK,
  ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_CLARIFICATIONS_LINK,
  ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_EMPTY,
} from "@/lib/architecture/architecture-created-findings-sources";
import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture/architecture-workspace-tabs";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK } from "@/lib/design-tokens";

import type { QuickDecisionSummaryProps } from "./types";

type QuickDecisionSummaryEmptyStateProps = {
  readonly props: QuickDecisionSummaryProps;
  readonly buyerPolishedShell: boolean;
  readonly headlineFindingCount: number | null | undefined;
  readonly headlineWarningCount: number | null | undefined;
};

export function QuickDecisionSummaryEmptyState({
  props,
  buyerPolishedShell,
  headlineFindingCount,
  headlineWarningCount,
}: QuickDecisionSummaryEmptyStateProps): ReactElement {
  if (
    buyerPolishedShell &&
    typeof headlineFindingCount === "number" &&
    Number.isFinite(headlineFindingCount) &&
    Math.trunc(headlineFindingCount) > 0
  ) {
    const n = Math.trunc(headlineFindingCount);
    const warningN =
      typeof headlineWarningCount === "number" && Number.isFinite(headlineWarningCount)
        ? Math.trunc(headlineWarningCount)
        : 0;

    const warningPhrase =
      warningN > 0
        ? " One monitored PHI minimization risk remains in this review record — review severity and controls below."
        : "";

    return (
      <p className="m-0 text-neutral-600 dark:text-neutral-400">
        {`This finalized review records ${n} finding${n === 1 ? "" : "s"} with no unresolved blocking issues.`}
        {warningPhrase}
      </p>
    );
  }

  if (props.packageCommitted === false) {
    if (props.analysisStagesComplete === true) {
      return (
        <p
          className="m-0 text-neutral-600 dark:text-neutral-400"
          data-testid="quick-decision-create-home-finalize-empty"
        >
          {ARCHITECTURE_CREATED_FINDINGS_FINALIZE_ELIGIBLE_EMPTY}
        </p>
      );
    }

    const activityHref = buildArchitectureWorkspaceTabHref(props.runId, "activity", {
      includeCreateIntent: true,
    });
    const clarificationsHref = buildArchitectureWorkspaceTabHref(props.runId, "clarifications", {
      includeCreateIntent: true,
    });

    return (
      <div className="space-y-2" data-testid="quick-decision-create-home-in-progress-empty">
        <p className="m-0 text-neutral-600 dark:text-neutral-400">
          {ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_EMPTY}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {props.onNavigateActivity !== undefined ? (
            <button
              type="button"
              className={cn("h-auto border-0 bg-transparent p-0", OPERATOR_LINK.nav)}
              onClick={props.onNavigateActivity}
            >
              {ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_ACTIVITY_LINK}
            </button>
          ) : (
            <Link href={activityHref} className={OPERATOR_LINK.nav}>
              {ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_ACTIVITY_LINK}
            </Link>
          )}
          {props.onNavigateClarifications !== undefined ? (
            <button
              type="button"
              className={cn("h-auto border-0 bg-transparent p-0", OPERATOR_LINK.nav)}
              onClick={props.onNavigateClarifications}
            >
              {ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_CLARIFICATIONS_LINK}
            </button>
          ) : (
            <Link href={clarificationsHref} className={OPERATOR_LINK.nav}>
              {ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_CLARIFICATIONS_LINK}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return <p className="m-0 text-neutral-600 dark:text-neutral-400">No findings to act on</p>;
}
