"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_ARCHITECTURE_LINK_LABEL,
  ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_BODY,
  buildActorDependentQuietEnginesArchitectureHref,
} from "@/lib/findings/actor-dependent-findings-quiet-engines-recovery";
import { countActorNodesInGraphSnapshot } from "@/lib/graph-snapshot-actor-count";
import { listSkippedMustQuestionKeys } from "@/lib/review-quality/list-skipped-must-question-keys";
import type { TransparencyTrail } from "@/types/feasibility-verdict";
import { cn } from "@/lib/utils";

export type RunDetailSealDeskCoverageStripProps = {
  readonly runId: string;
  readonly analysisStagesComplete?: boolean;
  readonly graphSnapshot?: unknown;
  readonly transparencyTrail?: TransparencyTrail | null;
  readonly className?: string;
};

/** Working seal-desk coverage facts: quiet engines + skipped MUST (RS-02). */
export function RunDetailSealDeskCoverageStrip(
  props: RunDetailSealDeskCoverageStripProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const actorNodeCount = countActorNodesInGraphSnapshot(props.graphSnapshot);
  const showQuietEngines =
    props.analysisStagesComplete === true && actorNodeCount === 0;
  const skippedMustKeys = listSkippedMustQuestionKeys(props.transparencyTrail);

  if (!isWorkingMode || (!showQuietEngines && skippedMustKeys.length === 0)) {
    return null;
  }

  const architectureHref = buildActorDependentQuietEnginesArchitectureHref(props.runId);

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.info, "space-y-3 p-4", props.className)}
      data-testid="run-detail-seal-desk-coverage-strip"
      role="status"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Coverage</p>
      {showQuietEngines ? (
        <div data-testid="run-detail-seal-desk-quiet-engines-line">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_BODY}</p>
          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
            <Link className={OPERATOR_LINK.nav} href={architectureHref}>
              {ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_ARCHITECTURE_LINK_LABEL}
            </Link>
          </p>
        </div>
      ) : null}
      {skippedMustKeys.length > 0 ? (
        <div data-testid="run-detail-seal-desk-skipped-must-line">
          <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.body)}>
            Skipped required questions ({skippedMustKeys.length})
          </p>
          <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
            {skippedMustKeys.map((questionKey) => (
              <li key={questionKey}>{questionKey}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
