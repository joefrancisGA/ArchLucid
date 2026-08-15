"use client";
import { MARKETING_CAPTION_TEXT_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import Link from "next/link";

import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import type { PipelineTimelineItem } from "@/types/authority";

function safeLocaleTime(iso: string): string {
  if (iso.trim().length === 0) {
    return "—";
  }

  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleString();
}

function manifestishEvent(eventType: string): boolean {
  return /manifest|commit|finalize|committed|golden|bundle/i.test(eventType);
}

function findingishEvent(eventType: string): boolean {
  return /finding|assessment|risk/i.test(eventType);
}

/**
 * Marketing showcase review-trail as stacked cards (friendlier than a bare list) with optional deep links into the
 * proof chain (run, manifest, primary finding) when identifiers are known.
 */
export function ShowcasePipelineReviewTrailCards(props: {
  readonly items: PipelineTimelineItem[];
  readonly runId: string;
  readonly goldenManifestId: string | null | undefined;
  readonly primaryFindingId?: string;
}) {
  const { items, runId, goldenManifestId, primaryFindingId } = props;
  const manifest =
    typeof goldenManifestId === "string" && goldenManifestId.trim().length > 0 ? goldenManifestId.trim() : null;

  if (items.length === 0) {
    return (
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body, MARKETING_CAPTION_TEXT_CLASS)} data-testid="showcase-pipeline-cards-empty">
        No review-trail events in this preview payload yet.
      </p>
    );
  }

  return (
    <ol
      className="m-0 flex list-none flex-col gap-3 p-0"
      aria-label="Review trail milestones"
      data-testid="showcase-pipeline-review-cards"
    >
      {items.map((row, index) => {
        const label = pipelineEventTypeFriendlyLabel(row.eventType);
        const showManifest = manifest !== null && manifestishEvent(row.eventType);
        const showFinding =
          primaryFindingId !== undefined &&
          primaryFindingId.trim().length > 0 &&
          findingishEvent(row.eventType);

        const showPrimaryReviewDeepLink = index === 0;

        return (
          <li
            key={row.eventId}
            className="rounded-lg border border-neutral-200 bg-white/90 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/50"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>{label}</p>
                <time
                  className={cn("mt-1 block font-medium", OPERATOR_TYPOGRAPHY.helper, MARKETING_CAPTION_TEXT_CLASS)}
                  dateTime={row.occurredUtc}
                >
                  {safeLocaleTime(row.occurredUtc)}
                </time>
                {row.actorUserName.trim().length > 0 ? (
                  <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Actor:</span>{" "}
                    {row.actorUserName}
                  </p>
                ) : null}
              </div>
              <div className={cn("flex flex-wrap gap-2", OPERATOR_TYPOGRAPHY.helper)}>
                {showPrimaryReviewDeepLink ? (
                  <Link
                    className={OPERATOR_LINK.stepPill}
                    href={`/architecture/reviews/${encodeURIComponent(runId)}`}
                  >
                    Review
                  </Link>
                ) : null}
                {showManifest ? (
                  <Link
                    className="rounded-md border border-neutral-300 bg-al-surface-raised px-2 py-1 font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600"
                    href={signedRecordDetailPath(manifest)}
                  >
                    Sealed review record
                  </Link>
                ) : null}
                {showFinding ? (
                  <Link
                    className="rounded-md border border-amber-600/40 bg-al-surface-raised px-2 py-1 font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-amber-700/50"
                    href={`/architecture/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(primaryFindingId.trim())}`}
                  >
                    Review finding
                  </Link>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
