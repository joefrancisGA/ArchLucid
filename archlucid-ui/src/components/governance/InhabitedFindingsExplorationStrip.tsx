"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { ArchitectureDraftCloneSnapshotControl } from "@/components/architecture/ArchitectureDraftCloneSnapshotControl";
import { Button } from "@/components/ui/button";
import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import { resolveArchitectureIdentityCurrentDraftState } from "@/lib/architecture/architecture-identity-current-draft";
import {
  INHABIT_FINDINGS_COMPARE_DISABLED_REASON,
  INHABIT_FINDINGS_COMPARE_HELPER,
  INHABIT_FINDINGS_SKETCH_CTA_LABEL,
  INHABIT_FINDINGS_SKETCH_HELPER,
  INHABIT_SKETCH_IS_PRACTICE_NOT_RECORD_BODY,
  INHABIT_SKETCH_IS_PRACTICE_NOT_RECORD_TITLE,
  INHABIT_SKETCH_PRACTICE_HELP_HREF,
} from "@/lib/inhabit/inhabit-exploration-copy";
import { resolveInhabitLatestPracticeSketchSibling } from "@/lib/inhabit/inhabit-latest-practice-sketch-sibling";
import { resolveArchitectureDeskCompareHref } from "@/lib/system-not-job-compare-entry-from-desk";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type InhabitedFindingsExplorationStripProps = {
  readonly architectureId: string;
  readonly scopedRunId?: string | null;
};

/** IH-047 / IH-049 / IH-050 / IH-052 — exploration on the inhabited findings document. */
export function InhabitedFindingsExplorationStrip(
  props: InhabitedFindingsExplorationStripProps,
): ReactElement | null {
  const architectureId = props.architectureId.trim();
  const identityQuery = useArchitectureIdentityQuery(architectureId, architectureId.length > 0);
  const identity = identityQuery.data;

  if (identity === undefined) {
    return null;
  }

  const draftState = resolveArchitectureIdentityCurrentDraftState(
    identity.drafts,
    identity.currentDraftId,
    identity.latestReviewId,
  );
  const cloneDraftId =
    draftState.kind === "spawn-locked" || draftState.kind === "drafting"
      ? draftState.draftId
      : draftState.kind === "none"
        ? draftState.cloneSourceDraftId
        : null;
  const compareResolution = resolveArchitectureDeskCompareHref({
    architectureId,
    reviews: identity.reviews,
    latestReviewId: identity.latestReviewId,
    selectedChildRunId: props.scopedRunId,
    workingMode: true,
  });
  const latestSketch = resolveInhabitLatestPracticeSketchSibling({
    architectureId,
    drafts: identity.drafts,
    currentDraftId: identity.currentDraftId,
    scopedRunId: props.scopedRunId,
  });

  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
      data-testid="inhabited-findings-exploration-strip"
    >
      <div className="space-y-1">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Explore on this architecture</h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {INHABIT_FINDINGS_SKETCH_HELPER}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2" data-testid="inhabited-findings-sketch-cta">
        {cloneDraftId !== null && cloneDraftId.length > 0 ? (
          <ArchitectureDraftCloneSnapshotControl
            draftId={cloneDraftId}
            parentArchitectureId={architectureId}
            buttonLabel={INHABIT_FINDINGS_SKETCH_CTA_LABEL}
            spawnLockedDeskAction
            testId="inhabited-findings-sketch-clone"
          />
        ) : null}

        {compareResolution.kind === "href" ? (
          <Button asChild size="sm" variant="outline">
            <Link href={compareResolution.href} data-testid="inhabited-findings-compare-cta">
              Compare committed reviews
            </Link>
          </Button>
        ) : (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {INHABIT_FINDINGS_COMPARE_DISABLED_REASON}
          </p>
        )}
      </div>

      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {INHABIT_FINDINGS_COMPARE_HELPER}
      </p>

      {latestSketch !== null ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="inhabited-findings-latest-practice-sketch">
          Latest {latestSketch.practiceStamp} sketch:{" "}
          <Link href={latestSketch.href} className={OPERATOR_LINK.nav}>
            {latestSketch.label}
          </Link>
        </p>
      ) : null}

      <div className="space-y-1" data-testid="inhabited-findings-sketch-practice-honesty">
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {INHABIT_SKETCH_IS_PRACTICE_NOT_RECORD_TITLE}
        </p>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {INHABIT_SKETCH_IS_PRACTICE_NOT_RECORD_BODY}{" "}
          <Link href={INHABIT_SKETCH_PRACTICE_HELP_HREF} className={OPERATOR_LINK.inline}>
            Sketch help
          </Link>
        </p>
      </div>
    </section>
  );
}
