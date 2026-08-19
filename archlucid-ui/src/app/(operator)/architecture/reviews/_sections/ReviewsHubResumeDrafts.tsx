"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { isArchitectureDraftEligibleToStartReview } from "@/lib/architecture/architecture-draft-ready-for-review";
import { trackArchitectureDraftResumeClick } from "@/lib/architecture/architecture-draft-resume-telemetry";
import {
  ARCHITECTURE_DRAFT_STATUS_LABELS,
  architectureDraftCustomerStatusTagKind,
} from "@/lib/architecture/architecture-draft-status";
import {
  architectureDraftPath,
  ARCHITECTURES_LIST_PATH,
  startReviewFromArchitectureHref,
} from "@/lib/architecture/architecture-routes";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import { formatRelativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";

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
      className="mt-4 rounded-md border border-neutral-200 bg-neutral-50/40 p-4 dark:border-neutral-800 dark:bg-neutral-900/20"
      data-testid="reviews-hub-resume-drafts"
      aria-label={REVIEWS_HUB_RESUME_DRAFTS_TITLE}
    >
      <h2 className={cn("m-0 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>{REVIEWS_HUB_RESUME_DRAFTS_TITLE}</h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {REVIEWS_HUB_RESUME_DRAFTS_BODY}
      </p>
      <ul className="m-0 mt-3 list-none space-y-3 p-0">
        {previewEntries.map((entry) => {
          const canStartReview = isArchitectureDraftEligibleToStartReview(entry);
          const absoluteUpdated = formatAbsoluteUpdatedTitle(entry.lastUpdatedUtc);

          return (
            <li
              key={entry.architectureId}
              className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800"
              data-testid={`reviews-hub-resume-draft-${entry.architectureId}`}
            >
              <p className={cn("m-0 line-clamp-2 break-words font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {entry.displayName}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <StatusTag
                  kind={architectureDraftCustomerStatusTagKind(entry.customerStatus)}
                  label={ARCHITECTURE_DRAFT_STATUS_LABELS[entry.customerStatus]}
                />
                <time
                  dateTime={entry.lastUpdatedUtc}
                  className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}
                >
                  Updated {formatRelativeTime(entry.lastUpdatedUtc)} ({absoluteUpdated})
                </time>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={architectureDraftPath(entry.architectureId)}
                    aria-label={`${REVIEWS_HUB_RESUME_DRAFTS_CONTINUE_LABEL}: ${entry.displayName}`}
                    data-testid={`reviews-hub-resume-draft-continue-${entry.architectureId}`}
                    onClick={() => {
                      trackArchitectureDraftResumeClick("reviews-hub", entry.architectureId);
                    }}
                  >
                    {REVIEWS_HUB_RESUME_DRAFTS_CONTINUE_LABEL}
                  </Link>
                </Button>
                {canStartReview ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={startReviewFromArchitectureHref(entry.architectureId)}
                      data-testid={`reviews-hub-resume-draft-start-${entry.architectureId}`}
                    >
                      {REVIEWS_HUB_RESUME_DRAFTS_START_LABEL}
                    </Link>
                  </Button>
                ) : null}
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
