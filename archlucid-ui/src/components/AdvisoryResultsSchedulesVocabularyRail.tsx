"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildAdvisoryResultsSchedulesVocabulary,
  resolveAdvisoryResultsSchedulesPeerLink,
  type AdvisoryResultsSchedulesSurfaceId,
  type AdvisoryResultsSchedulesVocabularyModel,
} from "@/lib/vocabulary/advisory-results-schedules-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AdvisoryResultsSchedulesVocabularyRailProps = {
  /** Surface hosting the strip — marks the current advisory job and links to the peer. */
  readonly currentSurfaceId: AdvisoryResultsSchedulesSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildAdvisoryResultsSchedulesVocabulary}. */
  readonly model?: AdvisoryResultsSchedulesVocabularyModel;
};

/**
 * TB-2280 — Compact vocabulary rail between Advisory results and Advisory schedules.
 * Mount on both advisory hub tabs so operators do not conflate results with schedules.
 * Distinct from Advisory ≠ Recurrence (TB-2246).
 */
export function AdvisoryResultsSchedulesVocabularyRail(
  props: AdvisoryResultsSchedulesVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildAdvisoryResultsSchedulesVocabulary();
  const peer = resolveAdvisoryResultsSchedulesPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "advisory-results" ? model.resultsLink : model.schedulesLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="advisory-results-schedules-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="advisory-results-schedules-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="advisory-results-schedules-vocabulary-heading"
      data-testid="advisory-results-schedules-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="advisory-results-schedules-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyTwo}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span
          className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="advisory-results-schedules-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="advisory-results-schedules-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
