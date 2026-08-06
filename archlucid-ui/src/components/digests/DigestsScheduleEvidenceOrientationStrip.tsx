"use client";

import Link from "next/link";

import {
  DIGESTS_SCHEDULE_SOURCES,
  DIGESTS_SCHEDULE_SOURCES_INTRO,
} from "@/lib/digests-schedule-evidence-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * Workspace Sources for the Schedule tab (DIS).
 *
 * Owner decision 2026-08-05: no claim-boundary band — see {@link DigestsSourcesStrip}.
 */
export function DigestsScheduleEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div data-testid="digests-schedule-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="digests-schedule-sources-heading"
        data-testid="digests-schedule-sources"
      >
        <h2
          id="digests-schedule-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {DIGESTS_SCHEDULE_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          {DIGESTS_SCHEDULE_SOURCES.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
