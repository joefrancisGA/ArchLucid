"use client";

import Link from "next/link";

import { ArchitectureDraftCloneSnapshotControl } from "@/components/architecture/ArchitectureDraftCloneSnapshotControl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveArchitectureReviewHref } from "@/lib/architecture/architecture-routes";
import { CTA_WIDTH, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { cn } from "@/lib/utils";

export const ARCHITECTURE_DRAFT_HANDOFF_LOCK_SENTENCE =
  "This architecture was handed off to a review. The draft stays read-only so the sealed record matches what you started.";

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
  const reviewLabel = props.linkedReviewTitle.trim().length > 0
    ? props.linkedReviewTitle
    : "Linked review";

  return (
    <div className="space-y-4" data-testid="architecture-draft-handoff-panel">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1">
            <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Handed off to review</h2>
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
              parentArchitectureId={props.parentArchitectureId}
              variant="outline"
            />
          </div>

          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            Need to change the architecture?{" "}
            <span className="text-neutral-800 dark:text-neutral-100">
              Start a new draft from this snapshot
            </span>{" "}
            instead of editing here.{" "}
            <Link href={reviewHref} className={OPERATOR_LINK.inline}>
              View review status
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
