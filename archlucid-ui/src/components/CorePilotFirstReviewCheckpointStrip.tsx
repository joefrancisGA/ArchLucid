"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import type { ReactElement } from "react";

import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { StatusTag } from "@/components/ui/status-tag";
import type { CorePilotCommitProgressState } from "@/lib/core-pilot-commit-progress";

import {
  buildFirstReviewCheckpointStrip,
  checkpointNextAction,
  FIRST_REVIEW_CHECKPOINT_ORDER,
  statusChipKind,
  statusChipLabel,
} from "./core-pilot-first-review-checkpoints";

export function CorePilotFirstReviewCheckpointStrip(props: {
  readonly pilotState: CorePilotCommitProgressState;
  readonly latestRunId: string | null;
  readonly firstCommittedRunId: string | null;
  readonly latestRunReadyToFinalize: boolean;
}): ReactElement {
  const checkpoints = buildFirstReviewCheckpointStrip(
    props.pilotState,
    props.latestRunId,
    props.firstCommittedRunId,
    props.latestRunReadyToFinalize,
  );
  const activeCheckpoint =
    checkpoints.find((checkpoint) => checkpoint.status === "active") ?? checkpoints[checkpoints.length - 1]!;

  return (
    <section
      className="mb-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2.5 dark:border-neutral-700"
      data-testid="first-review-checkpoint-strip"
      aria-label="First review checkpoints"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
          First-review checkpoints
        </p>
        <StatusTag kind="neutral" label={`Step ${FIRST_REVIEW_CHECKPOINT_ORDER.indexOf(activeCheckpoint.id) + 1} of 5`} />
      </div>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Operator lens: finish the highlighted checkpoint. Sponsor lens: export-ready starts once the review is committed and exported.
      </p>
      <ol className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
        {checkpoints.map((checkpoint, index) => (
          <li
            key={checkpoint.id}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <span className={cn("tabular-nums text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {index + 1}.
            </span>
            <Link href={checkpoint.href} className={cn(OPERATOR_LINK.step, OPERATOR_TYPOGRAPHY.helper)}>
              {checkpoint.label}
            </Link>
            <StatusTag kind={statusChipKind(checkpoint.status)} label={statusChipLabel(checkpoint.status)} />
          </li>
        ))}
      </ol>
      <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} data-testid="first-review-checkpoint-next-action">
        <InlineGuidanceText text={checkpointNextAction(activeCheckpoint.id, props.latestRunId)} />
      </p>
    </section>
  );
}
