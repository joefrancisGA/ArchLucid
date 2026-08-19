"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AskCitationActionFollowUp } from "@/lib/ask-citation-action-follow-ups";

export type AskCitationActionFollowUpsProps = {
  readonly chips: readonly AskCitationActionFollowUp[];
  /** When true and chips are empty, show an honest empty note instead of hiding the region. */
  readonly showHonestEmpty?: boolean;
};

/**
 * Post-answer deep-link chips for cited findings / evidence / disposition (TB-2219).
 */
export function AskCitationActionFollowUps(props: AskCitationActionFollowUpsProps) {
  const { chips, showHonestEmpty = false } = props;

  if (chips.length === 0) {
    if (!showHonestEmpty) {
      return null;
    }

    return (
      <div
        className="mt-3"
        data-testid="ask-citation-action-follow-ups"
        role="region"
        aria-label="Cited finding follow-ups"
      >
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          No linked finding, evidence, or decision to open from this answer.
        </p>
      </div>
    );
  }

  return (
    <div
      className="mt-3 space-y-2"
      data-testid="ask-citation-action-follow-ups"
      role="region"
      aria-label="Cited finding follow-ups"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
        Open cited evidence
      </p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Link
            key={`${chip.kind}-${chip.citationId}-${chip.href}`}
            href={chip.href}
            data-testid={`ask-citation-action-${chip.kind}`}
            className={cn(
              "inline-flex h-auto max-w-full items-center rounded-md border border-teal-700/30 bg-white px-2.5 py-1.5 font-medium text-teal-900 no-underline hover:bg-teal-50 dark:border-teal-600/40 dark:bg-neutral-900 dark:text-teal-200 dark:hover:bg-neutral-800",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            {chip.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
