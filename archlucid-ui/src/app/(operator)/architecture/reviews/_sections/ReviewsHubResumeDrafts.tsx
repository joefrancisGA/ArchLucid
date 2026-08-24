"use client";

import Link from "next/link";

import { ArchitectureDraftResumeControl } from "@/components/architecture/ArchitectureDraftResumeControl";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { isArchitectureDraftEligibleToStartReview } from "@/lib/architecture/architecture-draft-ready-for-review";
import {
  ARCHITECTURE_DRAFT_STATUS_LABELS,
  architectureDraftCustomerStatusTagKind,
} from "@/lib/architecture/architecture-draft-status";
import {
  ARCHITECTURES_LIST_PATH,
  startReviewFromArchitectureHref,
} from "@/lib/architecture/architecture-routes";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import { formatRelativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";

import { REVIEWS_HUB_RESUME_DRAFTS_SECTION_ID } from "./ReviewsHubSummaryRow";
import {
  REVIEWS_HUB_RESUME_DRAFTS_BODY,
  REVIEWS_HUB_RESUME_DRAFTS_CONTINUE_LABEL,
  REVIEWS_HUB_RESUME_DRAFTS_START_LABEL,
  REVIEWS_HUB_RESUME_DRAFTS_TITLE,
  REVIEWS_HUB_RESUME_DRAFTS_VIEW_ALL_LABEL,
} from "./reviews-hub-copy";
import { shouldShowReviewsHubResumeDrafts } from "./reviews-hub-header-primary";

const REVIEWS_HUB_RESUME_DRAFTS_PREVIEW_LIMIT = 3;

function formatAbsoluteUpdatedTitle(updatedUtc: string): string {
  const parsed = parseIsoUtcMs(updatedUtc);

  if (Number.isNaN(parsed)) {
    return updatedUtc;
  }

  return new Date(parsed).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Multi-draft supporting strip on `/architecture/reviews`.
 * Hidden when a single draft is already the header Continue target.
 */
export function ReviewsHubResumeDrafts(): React.JSX.Element | null {
  const entries = useArchitectureDraftRegistryEntries();

  if (!shouldShowReviewsHubResumeDrafts(entries.length)) {
    return null;
  }

  const previewEntries = entries.slice(0, REVIEWS_HUB_RESUME_DRAFTS_PREVIEW_LIMIT);

  return (
    <section
      className="mt-6"
      id={REVIEWS_HUB_RESUME_DRAFTS_SECTION_ID}
      data-testid="reviews-hub-resume-drafts"
      aria-label={REVIEWS_HUB_RESUME_DRAFTS_TITLE}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {REVIEWS_HUB_RESUME_DRAFTS_TITLE}
          <span className={cn("ml-2 font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            — {previewEntries.length}
          </span>
        </h2>
      </div>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {REVIEWS_HUB_RESUME_DRAFTS_BODY}
      </p>
      <ul className="m-0 mt-3 list-none divide-y divide-neutral-200 border-y border-neutral-200 p-0 dark:divide-neutral-800 dark:border-neutral-800">
        {previewEntries.map((entry) => {
          const canStartReview = isArchitectureDraftEligibleToStartReview(entry);
          const absoluteUpdated = formatAbsoluteUpdatedTitle(entry.lastUpdatedUtc);

          return (
            <li
              key={entry.architectureId}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              data-testid={`reviews-hub-resume-draft-${entry.architectureId}`}
            >
              <div className="min-w-0">
                <p className={cn("m-0 line-clamp-2 break-words font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {entry.displayName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <StatusTag
                    kind={architectureDraftCustomerStatusTagKind(entry.customerStatus)}
                    label={ARCHITECTURE_DRAFT_STATUS_LABELS[entry.customerStatus]}
                  />
                  <time
                    dateTime={entry.lastUpdatedUtc}
                    title={absoluteUpdated}
                    className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}
                  >
                    Updated {formatRelativeTime(entry.lastUpdatedUtc)}
                  </time>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {canStartReview ? (
                  <Button variant="default" size="sm" asChild>
                    <Link
                      href={startReviewFromArchitectureHref(entry.architectureId)}
                      data-testid={`reviews-hub-resume-draft-start-${entry.architectureId}`}
                    >
                      {REVIEWS_HUB_RESUME_DRAFTS_START_LABEL}
                    </Link>
                  </Button>
                ) : null}
                <ArchitectureDraftResumeControl
                  architectureId={entry.architectureId}
                  label={REVIEWS_HUB_RESUME_DRAFTS_CONTINUE_LABEL}
                  source="reviews-hub"
                  testId={`reviews-hub-resume-draft-continue-${entry.architectureId}`}
                  ariaLabel={`${REVIEWS_HUB_RESUME_DRAFTS_CONTINUE_LABEL}: ${entry.displayName}`}
                />
              </div>
            </li>
          );
        })}
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
