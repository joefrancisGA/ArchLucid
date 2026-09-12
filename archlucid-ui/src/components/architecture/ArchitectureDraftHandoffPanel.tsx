"use client";

import Link from "next/link";

import { ArchitectureDraftCloneSnapshotControl } from "@/components/architecture/ArchitectureDraftCloneSnapshotControl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  architectureDraftPath,
  architectureIdentityDraftHref,
  resolveArchitectureReviewHref,
} from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURE_SPAWN_LOCKED_DRAFT_BACK_TO_REVIEW_LABEL,
  assertSpawnLockedDraftBackHrefHonest,
  resolveSpawnLockedDraftBackLocator,
} from "@/lib/architecture/working-back-href";
import {
  ARCHITECTURE_DRAFT_SPAWN_LOCK_CLONE_LEGAL_SENTENCE,
  ARCHITECTURE_DRAFT_SPAWN_LOCK_PANEL_TITLE,
  ARCHITECTURE_DRAFT_SPAWN_LOCK_SNAPSHOT_SENTENCE,
} from "@/lib/architecture/architecture-draft-spawn-lock-url-honesty";
import { CTA_WIDTH, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { cn } from "@/lib/utils";

export const ARCHITECTURE_DRAFT_HANDOFF_LOCK_SENTENCE =
  `${ARCHITECTURE_DRAFT_SPAWN_LOCK_SNAPSHOT_SENTENCE} ${ARCHITECTURE_DRAFT_SPAWN_LOCK_CLONE_LEGAL_SENTENCE}`;

type ArchitectureDraftHandoffPanelProps = {
  readonly draftId: string;
  readonly parentArchitectureId?: string | null;
  readonly workspaceHeading: string;
  readonly linkedReviewId: string;
  readonly linkedReviewTitle: string;
  readonly fields: ArchitectureDraftFieldState;
};

/** Working-mode spawn-locked draft route — handoff, not an editable desk (SD-10). */
export function ArchitectureDraftHandoffPanel(
  props: ArchitectureDraftHandoffPanelProps,
): React.JSX.Element {
  const reviewHref = resolveArchitectureReviewHref(props.linkedReviewId, props.parentArchitectureId);
  const spawnLockedBackLocator = resolveSpawnLockedDraftBackLocator({
    linkedReviewId: props.linkedReviewId,
    parentArchitectureId: props.parentArchitectureId,
  });
  const parentArchitectureId = props.parentArchitectureId?.trim() ?? "";
  const draftEditorHref =
    parentArchitectureId.length > 0
      ? architectureIdentityDraftHref(parentArchitectureId, props.draftId)
      : architectureDraftPath(props.draftId);

  assertSpawnLockedDraftBackHrefHonest(spawnLockedBackLocator.reviewJobHref, draftEditorHref);

  const reviewLabel = props.linkedReviewTitle.trim().length > 0
    ? props.linkedReviewTitle
    : "Linked review";

  return (
    <div
      className="space-y-4"
      data-testid="architecture-draft-handoff-panel"
      data-spawn-lock-url-honesty="snapshot"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-draft-spawn-lock-back-honesty">
        <Link href={spawnLockedBackLocator.reviewJobHref} className={OPERATOR_LINK.nav}>
          {ARCHITECTURE_SPAWN_LOCKED_DRAFT_BACK_TO_REVIEW_LABEL}
        </Link>
        {spawnLockedBackLocator.architectureDeskHref !== null ? (
          <>
            <span className="text-al-text-secondary"> · </span>
            <Link href={spawnLockedBackLocator.architectureDeskHref} className={OPERATOR_LINK.nav}>
              Back to architecture desk
            </Link>
          </>
        ) : null}
      </p>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1">
            <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{ARCHITECTURE_DRAFT_SPAWN_LOCK_PANEL_TITLE}</h2>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{ARCHITECTURE_DRAFT_HANDOFF_LOCK_SENTENCE}</p>
          </div>

          <dl className="m-0 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className={OPERATOR_TYPOGRAPHY.helper}>Architecture</dt>
              <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{props.workspaceHeading}</dd>
            </div>
            <div>
              <dt className={OPERATOR_TYPOGRAPHY.helper}>Business outcome</dt>
              <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                {props.fields.businessOutcome.trim().length > 0 ? props.fields.businessOutcome : "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className={OPERATOR_TYPOGRAPHY.helper}>Intent summary</dt>
              <dd className={cn("m-0 whitespace-pre-wrap", OPERATOR_TYPOGRAPHY.body)}>
                {props.fields.freeTextIntent.trim().length > 0 ? props.fields.freeTextIntent : "—"}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              asChild
              type="button"
              className={CTA_WIDTH.content}
              data-testid="architecture-draft-handoff-open-review"
            >
              <Link href={reviewHref}>Open review — {reviewLabel}</Link>
            </Button>
            <ArchitectureDraftCloneSnapshotControl
              draftId={props.draftId}
              parentArchitectureId={props.parentArchitectureId ?? undefined}
              variant="outline"
            />
          </div>

          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="architecture-draft-spawn-lock-clone-honesty"
          >
            {ARCHITECTURE_DRAFT_SPAWN_LOCK_CLONE_LEGAL_SENTENCE}{" "}
            <Link href={reviewHref} className={OPERATOR_LINK.inline}>
              View review status
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
