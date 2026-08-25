"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  OPERATOR_RECENT_VIEWS_STORAGE_KEY,
  parseStoredRecentViews,
  type OperatorRecentViewEntry,
} from "@/lib/operator/operator-recent-views";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function readRecentReviewEntries(): readonly OperatorRecentViewEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);

    return state.entries.filter((entry) => entry.kind === "review").slice(0, 3);
  } catch {
    return [];
  }
}

/** Quick resume links to recently visited reviews on operator home. */
export function RecentReviewsResumeStrip(): React.JSX.Element | null {
  const [entries, setEntries] = useState<readonly OperatorRecentViewEntry[]>([]);

  useEffect(() => {
    setEntries(readRecentReviewEntries());
  }, []);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="recent-reviews-resume-heading"
      className="mb-3 rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="recent-reviews-resume-strip"
    >
      <h2
        id="recent-reviews-resume-heading"
        className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.body)}
      >
        Resume a recent review
      </h2>
      <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
        {entries.map((entry) => (
          <li key={entry.href}>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={entry.href}>{entry.label}</Link>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
