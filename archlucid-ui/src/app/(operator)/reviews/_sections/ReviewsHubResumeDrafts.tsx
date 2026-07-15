"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { trackArchitectureDraftResumeClick } from "@/lib/architecture-draft-resume-telemetry";
import {
  listArchitectureDraftRegistryEntries,
  type ArchitectureDraftRegistryEntry,
} from "@/lib/architecture-draft-registry";
import { architectureDraftPath, ARCHITECTURES_LIST_PATH } from "@/lib/architecture-routes";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import {
  REVIEWS_HUB_RESUME_DRAFTS_BODY,
  REVIEWS_HUB_RESUME_DRAFTS_CONTINUE_LABEL,
  REVIEWS_HUB_RESUME_DRAFTS_TITLE,
  REVIEWS_HUB_RESUME_DRAFTS_VIEW_ALL_LABEL,
} from "./reviews-hub-copy";

const REVIEWS_HUB_RESUME_DRAFTS_PREVIEW_LIMIT = 3;

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

/** Surfaces saved architecture drafts on the reviews hub when at least one exists. */
export function ReviewsHubResumeDrafts(): React.JSX.Element | null {
  const [entries, setEntries] = useState<readonly ArchitectureDraftRegistryEntry[]>([]);

  useEffect(() => {
    setEntries(listArchitectureDraftRegistryEntries());
  }, []);

  if (entries.length === 0) {
    return null;
  }

  const previewEntries = entries.slice(0, REVIEWS_HUB_RESUME_DRAFTS_PREVIEW_LIMIT);

  return (
    <section className="mt-4" data-testid="reviews-hub-resume-drafts" aria-label={REVIEWS_HUB_RESUME_DRAFTS_TITLE}>
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{REVIEWS_HUB_RESUME_DRAFTS_TITLE}</h2>
      <p className={cn("m-0 mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {REVIEWS_HUB_RESUME_DRAFTS_BODY}
      </p>
      <ul className="m-0 mt-3 list-none space-y-2 p-0">
        {previewEntries.map((entry) => (
          <li key={entry.architectureId} data-testid={`reviews-hub-resume-draft-${entry.architectureId}`}>
            <Link
              href={architectureDraftPath(entry.architectureId)}
              className={cn(OPERATOR_LINK.nav, "inline-flex flex-wrap items-baseline gap-x-2")}
              onClick={() => {
                trackArchitectureDraftResumeClick("reviews-hub", entry.architectureId);
              }}
            >
              <span className="font-medium text-al-text-primary">{entry.displayName}</span>
              <span className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
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
