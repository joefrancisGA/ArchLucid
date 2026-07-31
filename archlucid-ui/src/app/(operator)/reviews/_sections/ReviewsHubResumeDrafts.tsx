"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { trackArchitectureDraftResumeClick } from "@/lib/architecture-draft-resume-telemetry";
import { architectureDraftPath, ARCHITECTURES_LIST_PATH } from "@/lib/architecture-routes";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import {
  REVIEWS_HUB_RESUME_DRAFTS_BODY,
  REVIEWS_HUB_RESUME_DRAFTS_CONTINUE_LABEL,
  REVIEWS_HUB_RESUME_DRAFTS_TITLE,
  REVIEWS_HUB_RESUME_DRAFTS_VIEW_ALL_LABEL,
} from "./reviews-hub-copy";
import { shouldShowReviewsHubResumeDrafts } from "./reviews-hub-header-primary";

const REVIEWS_HUB_RESUME_DRAFTS_PREVIEW_LIMIT = 3;

type ReviewsHubResumeDraftsProps = {
  /** When the reviews inventory is empty, elevate this chooser above “Your reviews”. */
  readonly elevateAsPrimaryJob?: boolean;
};

function formatDraftUpdatedLabel(updatedUtc: string): string {
  const parsed = Date.parse(updatedUtc);

  if (Number.isNaN(parsed)) {
    return "recently";
  }

  return new Date(parsed).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Multi-draft chooser on `/reviews`. Hidden when a single draft is already the header Continue target.
 */
export function ReviewsHubResumeDrafts(props: ReviewsHubResumeDraftsProps = {}): React.JSX.Element | null {
  const elevateAsPrimaryJob = props.elevateAsPrimaryJob === true;
  const entries = useArchitectureDraftRegistryEntries();

  if (!shouldShowReviewsHubResumeDrafts(entries.length)) {
    return null;
  }

  const previewEntries = entries.slice(0, REVIEWS_HUB_RESUME_DRAFTS_PREVIEW_LIMIT);
  const titleClass = elevateAsPrimaryJob
    ? cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)
    : cn("m-0 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL);

  return (
    <section
      className="mt-4 rounded-md border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/30"
      data-testid="reviews-hub-resume-drafts"
      data-elevate-primary={elevateAsPrimaryJob ? "true" : "false"}
      aria-label={REVIEWS_HUB_RESUME_DRAFTS_TITLE}
    >
      <h2 className={titleClass}>{REVIEWS_HUB_RESUME_DRAFTS_TITLE}</h2>
      <p className={cn("m-0 mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {REVIEWS_HUB_RESUME_DRAFTS_BODY}
      </p>
      <ul className="m-0 mt-3 list-none space-y-2 p-0">
        {previewEntries.map((entry) => (
          <li key={entry.architectureId} data-testid={`reviews-hub-resume-draft-${entry.architectureId}`}>
            <Link
              href={architectureDraftPath(entry.architectureId)}
              className={cn(
                OPERATOR_LINK.nav,
                "inline-flex max-w-full flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2",
              )}
              title={entry.displayName}
              onClick={() => {
                trackArchitectureDraftResumeClick("reviews-hub", entry.architectureId);
              }}
            >
              <span className="line-clamp-2 break-words font-medium text-al-text-primary">{entry.displayName}</span>
              <span className={cn(OPERATOR_TYPOGRAPHY.helper, "shrink-0 text-al-text-secondary")}>
                Updated {formatDraftUpdatedLabel(entry.lastUpdatedUtc)}
              </span>
              <span className="sr-only">{REVIEWS_HUB_RESUME_DRAFTS_CONTINUE_LABEL}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={ARCHITECTURES_LIST_PATH} data-testid="reviews-hub-resume-drafts-view-all">
            {REVIEWS_HUB_RESUME_DRAFTS_VIEW_ALL_LABEL}
          </Link>
        </Button>
      </div>
    </section>
  );
}
